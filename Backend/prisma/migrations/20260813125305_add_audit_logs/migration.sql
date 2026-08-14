-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "actorId" TEXT,
    "actorEmployeeId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "branchId" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "description" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "httpMethod" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_branchId_createdAt_idx" ON "AuditLog"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
