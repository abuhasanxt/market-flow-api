import { Worker } from "bullmq";
import { redisConnection } from "./connection";

export const payoutWorker = new Worker(
  "payout-queue",
  async (job) => {
    console.log("Payout job received!");

    console.log("Job ID:", job.id);
    console.log("Job Name:", job.name);
    console.log("Job Data:", job.data);

    const { subOrderId, vendorId, amount } = job.data;

    console.log(`Processing payout...`);
    console.log(`SubOrder: ${subOrderId}`);
    console.log(`Vendor: ${vendorId}`);
    console.log(`Amount: ${amount}`);

    // এখানে পরে actual payout logic আসবে
  },
  {
    connection: redisConnection,
  }
);

payoutWorker.on("completed", (job) => {
  console.log(`Payout job ${job.id} completed`);
});

payoutWorker.on("failed", (job, error) => {
  console.error(`Payout job ${job?.id} failed:`, error);
});