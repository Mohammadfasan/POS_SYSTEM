-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "branchId" TEXT,
    "type" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "dedupeKey" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_isRead_createdAt_idx" ON "Notification"("recipientUserId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_branchId_createdAt_idx" ON "Notification"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_priority_createdAt_idx" ON "Notification"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
