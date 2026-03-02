/*
  Warnings:

  - You are about to alter the column `score` on the `AssessmentScore` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `clerkOrganizationId` on the `UseCase` table. All the data in the column will be lost.
  - You are about to drop the column `clerkUserId` on the `UseCase` table. All the data in the column will be lost.
  - You are about to drop the column `clerkOrganizationId` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `clerkUserId` on the `Vendor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[aiucId,organizationId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[aiucId,userId]` on the table `UseCase` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Iso42001AnnexInstance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('QZEN_ADMIN', 'ORG_ADMIN', 'ORG_USER', 'USER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Iso42001AnnexInstance" DROP CONSTRAINT "Iso42001AnnexInstance_assessmentId_fkey";

-- DropIndex
DROP INDEX "UseCase_aiucId_clerkOrganizationId_key";

-- DropIndex
DROP INDEX "UseCase_aiucId_clerkUserId_key";

-- DropIndex
DROP INDEX "UseCase_clerkOrganizationId_clerkUserId_idx";

-- DropIndex
DROP INDEX "UseCase_clerkOrganizationId_idx";

-- DropIndex
DROP INDEX "UseCase_clerkUserId_idx";

-- DropIndex
DROP INDEX "Vendor_clerkOrganizationId_idx";

-- DropIndex
DROP INDEX "Vendor_clerkUserId_idx";

-- AlterTable
ALTER TABLE "AssessmentScore" ALTER COLUMN "score" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Iso42001AnnexInstance" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UseCase" DROP COLUMN "clerkOrganizationId",
DROP COLUMN "clerkUserId",
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "clerkOrganizationId",
DROP COLUMN "clerkUserId",
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "organizationId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_domain_idx" ON "Organization"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE INDEX "Invitation_token_idx" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- CreateIndex
CREATE INDEX "UseCase_organizationId_idx" ON "UseCase"("organizationId");

-- CreateIndex
CREATE INDEX "UseCase_userId_idx" ON "UseCase"("userId");

-- CreateIndex
CREATE INDEX "UseCase_organizationId_userId_idx" ON "UseCase"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_organizationId_key" ON "UseCase"("aiucId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UseCase_aiucId_userId_key" ON "UseCase"("aiucId", "userId");

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");

-- RenameForeignKey
ALTER TABLE "Iso42001AnnexInstance" RENAME CONSTRAINT "Iso42001AnnexInstance_itemId_fkey" TO "Iso42001AnnexInstance_annexItemId_fkey";

-- AddForeignKey
ALTER TABLE "UseCase" ADD CONSTRAINT "UseCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UseCase" ADD CONSTRAINT "UseCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001AnnexInstance" ADD CONSTRAINT "Iso42001AnnexInstance_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Iso42001Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Iso42001AnnexInstance_assessmentId_itemId_key" RENAME TO "Iso42001AnnexInstance_assessmentId_annexItemId_key";
