import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const payoutQueue = new Queue("payout-queue", {
  connection: redisConnection,
});

export const addPayoutJob = async (
  subOrderId: string,
  vendorId: string,
  amount: number
) => {
  await payoutQueue.add("process-payout", {
    subOrderId,
    vendorId,
    amount,
  });
};