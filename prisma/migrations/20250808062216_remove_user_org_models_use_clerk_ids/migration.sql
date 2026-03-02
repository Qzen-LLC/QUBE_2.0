/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Iso42001AnnexInstance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Iso42001AnnexInstance` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `UseCase` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UseCase` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the `Invitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[aiucId,clerkOrganizationId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aiucId,clerkUserId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Iso42001AnnexInstance" DROP CONSTRAINT "Iso42001AnnexInstance_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "UseCase" DROP CONSTRAINT "UseCase_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UseCase" DROP CONSTRAINT "UseCase_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_userId_fkey";

-- DropIndex
DROP INDEX "UseCase_aiucId_organizationId_key";

-- DropIndex
DROP INDEX "UseCase_aiucId_userId_key";

-- DropIndex
DROP INDEX "UseCase_organizationId_idx";

-- DropIndex
DROP INDEX "UseCase_organizationId_userId_idx";

-- DropIndex
DROP INDEX "UseCase_userId_idx";

-- DropIndex
DROP INDEX "Vendor_organizationId_idx";

-- DropIndex
DROP INDEX "Vendor_userId_idx";

-- AlterTable
ALTER TABLE "AssessmentScore" ALTER COLUMN "score" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Iso42001AnnexInstance" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "UseCase" DROP COLUMN "organizationId",
DROP COLUMN "userId",
ADD COLUMN     "clerkOrganizationId" TEXT,
ADD COLUMN     "clerkUserId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "organizationId",
DROP COLUMN "userId",
ADD COLUMN     "clerkOrganizationId" TEXT,
ADD COLUMN     "clerkUserId" TEXT;

-- DropTable
DROP TABLE "Invitation";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "InvitationStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "UseCase_clerkOrganizationId_idx" ON "UseCase"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "UseCase_clerkUserId_idx" ON "UseCase"("clerkUserId");

-- CreateIndex
CREATE INDEX "UseCase_clerkOrganizationId_clerkUserId_idx" ON "UseCase"("clerkOrganizationId", "clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_clerkOrganizationId_key" ON "UseCase"("aiucId", "clerkOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_clerkUserId_key" ON "UseCase"("aiucId", "clerkUserId");

-- CreateIndex
CREATE INDEX "Vendor_clerkOrganizationId_idx" ON "Vendor"("clerkOrganizationId");

-- CreateIndex
CREATE INDEX "Vendor_clerkUserId_idx" ON "Vendor"("clerkUserId");

-- RenameForeignKey
ALTER TABLE "Iso42001AnnexInstance" RENAME CONSTRAINT "Iso42001AnnexInstance_annexItemId_fkey" TO "Iso42001AnnexInstance_itemId_fkey";

-- AddForeignKey
ALTER TABLE "Iso42001AnnexInstance" ADD CONSTRAINT "Iso42001AnnexInstance_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Iso42001Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Iso42001AnnexInstance_assessmentId_annexItemId_key" RENAME TO "Iso42001AnnexInstance_assessmentId_itemId_key";
