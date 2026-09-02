import { Worker } from "bullmq";
import { redisConnection } from "./connection";
import { prisma } from "../lib/prisma";
import { PayoutStatus } from "../../generated/prisma/enums";
import { randomUUID } from "node:crypto";

export const payoutWorker = new Worker(
  "payout-queue",
  async (job) => {
    console.log("Payout job received!");

    const { subOrderId, vendorId, amount } = job.data;

    console.log(
      "Processing payout for SubOrder:",
      subOrderId,
      "Vendor:",
      vendorId,
      "Amount:",
      amount,
    );
    await prisma.$transaction(async (tx) => {
      //  Find SubOrder
      const subOrder = await tx.subOrder.findUnique({
        where: {
          id: subOrderId,
        },
      });

      if (!subOrder) {
        throw new Error(`SubOrder ${subOrderId} not found`);
      }

      //  Vendor check
      if (subOrder.vendorId !== vendorId) {
        throw new Error(`Vendor mismatch for SubOrder ${subOrderId}`);
      }

      //  Amount check
      if (subOrder.vendorEarning !== amount) {
        throw new Error(`Payout amount mismatch for SubOrder ${subOrderId}`);
      }

      // Atomic payout claim
      const payoutClaim = await tx.subOrder.updateMany({
        where: {
          id: subOrderId,
          payoutStatus: PayoutStatus.PENDING,
        },
        data: {
          payoutStatus: PayoutStatus.PAID,
        },
      });

      // Already processed
      if (payoutClaim.count === 0) {
        console.log(`Payout already processed for ${subOrderId}`);

        return;
      }

      //create payout recode
      await tx.payout.create({
        data: {
          vendorId,
          subOrderId,
          amount,
          status: PayoutStatus.PAID,
          transactionId: randomUUID(),
        },
      });

      //  Update vendor balance
      await tx.vendor.update({
        where: {
          id: vendorId,
        },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      console.log(`Payout ${amount} added to vendor ${vendorId}`);
    });
  },
  {
    connection: redisConnection,
  },
);

payoutWorker.on("completed", (job) => {
  console.log(`Payout job ${job.id} completed`);
});

payoutWorker.on("failed", (job, error) => {
  console.error("❌ Payout job failed", {
    jobId: job?.id,
    subOrderId: job?.data?.subOrderId,
    attempt: job?.attemptsMade,
    error: error.message,
  });
});
