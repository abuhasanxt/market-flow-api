-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "subOrderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payouts_subOrderId_key" ON "payouts"("subOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transactionId_key" ON "payouts"("transactionId");

-- CreateIndex
CREATE INDEX "payouts_vendorId_idx" ON "payouts"("vendorId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
