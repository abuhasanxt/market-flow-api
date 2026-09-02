import { Worker } from "bullmq";
import { redisConnection } from "./connection";
import { prisma } from "../lib/prisma";
import { PayoutStatus } from "../../generated/prisma/enums";

export const payoutWorker = new Worker(
  "payout-queue",
  async (job) => {
    console.log("Payout job received!");

    const { subOrderId, vendorId, amount } = job.data;

console.log("Processing payout for SubOrder:", subOrderId, "Vendor:", vendorId, "Amount:", amount);

    await prisma.$transaction(async (tx) => {
      // 1. Find SubOrder
      const subOrder = await tx.subOrder.findUnique({
        where: {
          id: subOrderId,
        },
      });

      if (!subOrder) {
        throw new Error(
          `SubOrder ${subOrderId} not found`,
        );
      }

      // 2. Vendor check
      if (subOrder.vendorId !== vendorId) {
        throw new Error(
          `Vendor mismatch for SubOrder ${subOrderId}`,
        );
      }

      // 3. Amount check
      if (subOrder.vendorEarning !== amount) {
        throw new Error(
          `Payout amount mismatch for SubOrder ${subOrderId}`,
        );
      }

      // 4. Atomic payout claim
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
        console.log(
          `Payout already processed for ${subOrderId}`,
        );

        return;
      }

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

      console.log(
        `Payout ${amount} added to vendor ${vendorId}`,
      );
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
  console.error(
    `Payout job ${job?.id} failed:`,
    error,
  );
});