/*
  Warnings:

  - You are about to drop the column `subtotal` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `SaleItem` table. All the data in the column will be lost.
  - Added the required column `baseQuantity` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineSubtotal` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineTotal` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedUnitCode` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedUnitFactor` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedUnitId` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedUnitSymbol` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellingUnitFactor` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellingUnitPrice` to the `SaleItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'QR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "subtotal",
DROP COLUMN "total",
DROP COLUMN "unitPrice",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "baseQuantity" DECIMAL(18,3) NOT NULL,
ADD COLUMN     "lineSubtotal" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "lineTotal" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "selectedUnitCode" TEXT NOT NULL,
ADD COLUMN     "selectedUnitFactor" DECIMAL(18,6) NOT NULL,
ADD COLUMN     "selectedUnitId" TEXT NOT NULL,
ADD COLUMN     "selectedUnitSymbol" TEXT NOT NULL,
ADD COLUMN     "sellingUnitFactor" DECIMAL(18,6) NOT NULL,
ADD COLUMN     "sellingUnitPrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(14,2) NOT NULL,
    "tenderedAmount" DECIMAL(14,2),
    "changeAmount" DECIMAL(14,2),
    "transactionReference" TEXT,
    "note" TEXT,
    "saleId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "drawerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Payment_shiftId_idx" ON "Payment"("shiftId");

-- CreateIndex
CREATE INDEX "Payment_cashierId_idx" ON "Payment"("cashierId");

-- CreateIndex
CREATE INDEX "Payment_method_idx" ON "Payment"("method");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_drawerId_fkey" FOREIGN KEY ("drawerId") REFERENCES "CashDrawer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
