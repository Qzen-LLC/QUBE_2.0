-- AlterTable
ALTER TABLE "UseCase" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "UseCase_organizationId_idx" ON "UseCase"("organizationId");

-- CreateIndex
CREATE INDEX "UseCase_userId_idx" ON "UseCase"("userId");

-- CreateIndex
CREATE INDEX "UseCase_organizationId_userId_idx" ON "UseCase"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "UseCase" ADD CONSTRAINT "UseCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UseCase" ADD CONSTRAINT "UseCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
