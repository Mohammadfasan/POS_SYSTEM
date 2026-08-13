/*
  Warnings:

  - A unique constraint covering the columns `[sourceHeldBillId]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "HeldBillStatus" AS ENUM ('HELD', 'RESUMING', 'RESUMED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "sourceHeldBillId" TEXT;

-- CreateTable
CREATE TABLE "HeldBill" (
    "id" TEXT NOT NULL,
    "holdNumber" TEXT NOT NULL,
    "status" "HeldBillStatus" NOT NULL DEFAULT 'HELD',
    "note" TEXT,
    "branchId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resumedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeldBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeldBillItem" (
    "id" TEXT NOT NULL,
    "heldBillId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitSymbol" TEXT NOT NULL,
    "unitFactor" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeldBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeldBill_holdNumber_key" ON "HeldBill"("holdNumber");

-- CreateIndex
CREATE INDEX "HeldBill_branchId_idx" ON "HeldBill"("branchId");

-- CreateIndex
CREATE INDEX "HeldBill_terminalId_idx" ON "HeldBill"("terminalId");

-- CreateIndex
CREATE INDEX "HeldBill_shiftId_idx" ON "HeldBill"("shiftId");

-- CreateIndex
CREATE INDEX "HeldBill_cashierId_idx" ON "HeldBill"("cashierId");

-- CreateIndex
CREATE INDEX "HeldBill_status_idx" ON "HeldBill"("status");

-- CreateIndex
CREATE INDEX "HeldBill_expiresAt_idx" ON "HeldBill"("expiresAt");

-- CreateIndex
CREATE INDEX "HeldBillItem_heldBillId_idx" ON "HeldBillItem"("heldBillId");

-- CreateIndex
CREATE INDEX "HeldBillItem_productId_idx" ON "HeldBillItem"("productId");

-- CreateIndex
CREATE INDEX "HeldBillItem_unitId_idx" ON "HeldBillItem"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_sourceHeldBillId_key" ON "Sale"("sourceHeldBillId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sourceHeldBillId_fkey" FOREIGN KEY ("sourceHeldBillId") REFERENCES "HeldBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBill" ADD CONSTRAINT "HeldBill_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBill" ADD CONSTRAINT "HeldBill_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBill" ADD CONSTRAINT "HeldBill_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBill" ADD CONSTRAINT "HeldBill_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBillItem" ADD CONSTRAINT "HeldBillItem_heldBillId_fkey" FOREIGN KEY ("heldBillId") REFERENCES "HeldBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBillItem" ADD CONSTRAINT "HeldBillItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeldBillItem" ADD CONSTRAINT "HeldBillItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
