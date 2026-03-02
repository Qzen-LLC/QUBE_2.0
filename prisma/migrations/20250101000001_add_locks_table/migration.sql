-- CreateEnum
CREATE TYPE "LockType" AS ENUM ('SHARED', 'EXCLUSIVE');

-- CreateTable
CREATE TABLE "Lock" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LockType" NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lock_useCaseId_userId_type_key" ON "Lock"("useCaseId", "userId", "type");

-- CreateIndex
CREATE INDEX "Lock_useCaseId_idx" ON "Lock"("useCaseId");

-- CreateIndex
CREATE INDEX "Lock_userId_idx" ON "Lock"("userId");

-- CreateIndex
CREATE INDEX "Lock_type_idx" ON "Lock"("type");

-- CreateIndex
CREATE INDEX "Lock_isActive_idx" ON "Lock"("isActive");

-- CreateIndex
CREATE INDEX "Lock_expiresAt_idx" ON "Lock"("expiresAt");

-- AddForeignKey
ALTER TABLE "Lock" ADD CONSTRAINT "Lock_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lock" ADD CONSTRAINT "Lock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
