-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "CashierShift" (
    "id" TEXT NOT NULL,
    "shiftNumber" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DECIMAL(14,2) NOT NULL,
    "cashSales" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cashRefunds" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cashIn" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cashOut" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expectedCash" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(14,2),
    "cashDifference" DECIMAL(14,2),
    "openingNote" TEXT,
    "closingNote" TEXT,
    "closedById" TEXT,
    "activeCashierKey" TEXT,
    "activeTerminalKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashierShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashierShift_shiftNumber_key" ON "CashierShift"("shiftNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CashierShift_activeCashierKey_key" ON "CashierShift"("activeCashierKey");

-- CreateIndex
CREATE UNIQUE INDEX "CashierShift_activeTerminalKey_key" ON "CashierShift"("activeTerminalKey");

-- CreateIndex
CREATE INDEX "CashierShift_cashierId_idx" ON "CashierShift"("cashierId");

-- CreateIndex
CREATE INDEX "CashierShift_branchId_idx" ON "CashierShift"("branchId");

-- CreateIndex
CREATE INDEX "CashierShift_terminalId_idx" ON "CashierShift"("terminalId");

-- CreateIndex
CREATE INDEX "CashierShift_status_idx" ON "CashierShift"("status");

-- CreateIndex
CREATE INDEX "CashierShift_openedAt_idx" ON "CashierShift"("openedAt");

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashierShift" ADD CONSTRAINT "CashierShift_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
