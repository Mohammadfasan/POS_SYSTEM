-- CreateEnum
CREATE TYPE "CashDrawerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "CashDrawerTransactionType" AS ENUM ('CASH_IN', 'CASH_OUT', 'SALE', 'REFUND');

-- CreateTable
CREATE TABLE "CashDrawer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CashDrawerStatus" NOT NULL DEFAULT 'ACTIVE',
    "terminalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashDrawer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDrawerTransaction" (
    "id" TEXT NOT NULL,
    "type" "CashDrawerTransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balanceBefore" DECIMAL(14,2) NOT NULL,
    "balanceAfter" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "drawerId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashDrawerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashDrawer_code_key" ON "CashDrawer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CashDrawer_terminalId_key" ON "CashDrawer"("terminalId");

-- CreateIndex
CREATE INDEX "CashDrawer_status_idx" ON "CashDrawer"("status");

-- CreateIndex
CREATE INDEX "CashDrawerTransaction_drawerId_idx" ON "CashDrawerTransaction"("drawerId");

-- CreateIndex
CREATE INDEX "CashDrawerTransaction_shiftId_idx" ON "CashDrawerTransaction"("shiftId");

-- CreateIndex
CREATE INDEX "CashDrawerTransaction_createdById_idx" ON "CashDrawerTransaction"("createdById");

-- CreateIndex
CREATE INDEX "CashDrawerTransaction_type_idx" ON "CashDrawerTransaction"("type");

-- CreateIndex
CREATE INDEX "CashDrawerTransaction_createdAt_idx" ON "CashDrawerTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawerTransaction" ADD CONSTRAINT "CashDrawerTransaction_drawerId_fkey" FOREIGN KEY ("drawerId") REFERENCES "CashDrawer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawerTransaction" ADD CONSTRAINT "CashDrawerTransaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CashierShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDrawerTransaction" ADD CONSTRAINT "CashDrawerTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
