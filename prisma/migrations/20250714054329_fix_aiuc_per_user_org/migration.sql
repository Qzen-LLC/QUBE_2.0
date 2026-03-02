/*
  Warnings:

  - A unique constraint covering the columns `[aiucId,organizationId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aiucId,userId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UseCase_aiucId_key";

-- AlterTable
ALTER TABLE "UseCase" ALTER COLUMN "aiucId" DROP DEFAULT;
DROP SEQUENCE "UseCase_aiucId_seq";

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_organizationId_key" ON "UseCase"("aiucId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_userId_key" ON "UseCase"("aiucId", "userId");
