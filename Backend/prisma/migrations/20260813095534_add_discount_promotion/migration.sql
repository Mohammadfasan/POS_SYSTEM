-- CreateEnum
CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PromotionScope" AS ENUM ('CART', 'PRODUCT', 'CATEGORY');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DiscountRequestStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "PromotionDiscountType" NOT NULL,
    "scope" "PromotionScope" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "minPurchaseAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "maxDiscountAmount" DECIMAL(14,2),
    "autoApply" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "branchId" TEXT,
    "productId" TEXT,
    "categoryId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalePromotion" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "promotionCode" TEXT NOT NULL,
    "promotionName" TEXT NOT NULL,
    "scope" "PromotionScope" NOT NULL,
    "discountType" "PromotionDiscountType" NOT NULL,
    "discountValue" DECIMAL(14,2) NOT NULL,
    "discountAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualDiscount" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "discountType" "PromotionDiscountType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "appliedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" "DiscountRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "appliedById" TEXT,
    "rejectedById" TEXT,
    "cancelledById" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_branchId_idx" ON "Promotion"("branchId");

-- CreateIndex
CREATE INDEX "Promotion_productId_idx" ON "Promotion"("productId");

-- CreateIndex
CREATE INDEX "Promotion_categoryId_idx" ON "Promotion"("categoryId");

-- CreateIndex
CREATE INDEX "Promotion_status_idx" ON "Promotion"("status");

-- CreateIndex
CREATE INDEX "Promotion_startAt_idx" ON "Promotion"("startAt");

-- CreateIndex
CREATE INDEX "Promotion_endAt_idx" ON "Promotion"("endAt");

-- CreateIndex
CREATE INDEX "SalePromotion_saleId_idx" ON "SalePromotion"("saleId");

-- CreateIndex
CREATE INDEX "SalePromotion_promotionId_idx" ON "SalePromotion"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "SalePromotion_saleId_promotionId_key" ON "SalePromotion"("saleId", "promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualDiscount_requestNumber_key" ON "ManualDiscount"("requestNumber");

-- CreateIndex
CREATE INDEX "ManualDiscount_saleId_idx" ON "ManualDiscount"("saleId");

-- CreateIndex
CREATE INDEX "ManualDiscount_branchId_idx" ON "ManualDiscount"("branchId");

-- CreateIndex
CREATE INDEX "ManualDiscount_status_idx" ON "ManualDiscount"("status");

-- CreateIndex
CREATE INDEX "ManualDiscount_requestedById_idx" ON "ManualDiscount"("requestedById");

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePromotion" ADD CONSTRAINT "SalePromotion_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalePromotion" ADD CONSTRAINT "SalePromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualDiscount" ADD CONSTRAINT "ManualDiscount_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
