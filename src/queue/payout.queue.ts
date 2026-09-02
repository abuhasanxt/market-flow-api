import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const payoutQueue = new Queue("payout-queue", {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log("payout.queue.ts");

export const addPayoutJob = async (
  subOrderId: string,
  vendorId: string,
  amount: number
) => {
  console.log("➡️ Adding payout job...");

  try {
    const job = await payoutQueue.add("process-payout", {
      subOrderId,
      vendorId,
      amount,
    });

    console.log("✅ Payout job added:", job.id);

    return job;
  } catch (error) {
    console.error("❌ Payout queue error:", error);
    throw error;
  }
};