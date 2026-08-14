-- CreateEnum
CREATE TYPE "VoidStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "CashDrawerTransactionType" ADD VALUE 'VOID';

-- CreateTable
CREATE TABLE "VoidRequest" (
    "id" TEXT NOT NULL,
    "voidNumber" TEXT NOT NULL,
    "status" "VoidStatus" NOT NULL DEFAULT 'PENDING',
    "saleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "rejectedById" TEXT,
    "cancelledById" TEXT,
    "completedById" TEXT,
    "reason" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "cancelReason" TEXT,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "executionIdempotencyKey" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoidRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoidRefund" (
    "id" TEXT NOT NULL,
    "refundNumber" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'COMPLETED',
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "transactionReference" TEXT,
    "note" TEXT,
    "voidRequestId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "processedById" TEXT NOT NULL,
    "drawerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoidRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoidRequest_voidNumber_key" ON "VoidRequest"("voidNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VoidRequest_executionIdempotencyKey_key" ON "VoidRequest"("executionIdempotencyKey");

-- CreateIndex
CREATE INDEX "VoidRequest_saleId_idx" ON "VoidRequest"("saleId");

-- CreateIndex
CREATE INDEX "VoidRequest_branchId_idx" ON "VoidRequest"("branchId");

-- CreateIndex
CREATE INDEX "VoidRequest_requestedById_idx" ON "VoidRequest"("requestedById");

-- CreateIndex
CREATE INDEX "VoidRequest_status_idx" ON "VoidRequest"("status");

-- CreateIndex
CREATE INDEX "VoidRequest_requestedAt_idx" ON "VoidRequest"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoidRefund_refundNumber_key" ON "VoidRefund"("refundNumber");

-- CreateIndex
CREATE INDEX "VoidRefund_voidRequestId_idx" ON "VoidRefund"("voidRequestId");

-- CreateIndex
CREATE INDEX "VoidRefund_paymentId_idx" ON "VoidRefund"("paymentId");

-- CreateIndex
CREATE INDEX "VoidRefund_shiftId_idx" ON "VoidRefund"("shiftId");

-- CreateIndex
CREATE INDEX "VoidRefund_processedById_idx" ON "VoidRefund"("processedById");

-- CreateIndex
CREATE INDEX "VoidRefund_method_idx" ON "VoidRefund"("method");

-- CreateIndex
CREATE INDEX "VoidRefund_createdAt_idx" ON "VoidRefund"("createdAt");

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRequest" ADD CONSTRAINT "VoidRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRefund" ADD CONSTRAINT "VoidRefund_voidRequestId_fkey" FOREIGN KEY ("voidRequestId") REFERENCES "VoidRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRefund" ADD CONSTRAINT "VoidRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRefund" ADD CONSTRAINT "VoidRefund_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRefund" ADD CONSTRAINT "VoidRefund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoidRefund" ADD CONSTRAINT "VoidRefund_drawerId_fkey" FOREIGN KEY ("drawerId") REFERENCES "CashDrawer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
