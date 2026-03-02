/*
  Warnings:

  - You are about to drop the column `annexItemId` on the `Iso42001AnnexInstance` table. All the data in the column will be lost.
  - You are about to drop the column `evidence` on the `Iso42001AnnexInstance` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Iso42001AnnexInstance` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assessmentId,itemId]` on the table `Iso42001AnnexInstance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `Iso42001AnnexInstance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'MITIGATED', 'ACCEPTED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "Iso42001AnnexInstance" DROP CONSTRAINT "Iso42001AnnexInstance_annexItemId_fkey";

-- DropIndex
DROP INDEX "Iso42001AnnexInstance_assessmentId_annexItemId_key";

-- AlterTable
ALTER TABLE "Iso42001AnnexInstance" DROP COLUMN "annexItemId",
DROP COLUMN "evidence",
DROP COLUMN "notes",
ADD COLUMN     "evidenceFiles" TEXT[],
ADD COLUMN     "implementation" TEXT,
ADD COLUMN     "itemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UseCase" ADD COLUMN     "estimatedTimelineMonths" TEXT DEFAULT '',
ADD COLUMN     "initialCost" TEXT DEFAULT '',
ADD COLUMN     "keyBenefits" TEXT DEFAULT '',
ADD COLUMN     "plannedStartDate" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "likelihood" TEXT NOT NULL,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "assignedToEmail" TEXT,
    "mitigationPlan" TEXT,
    "mitigationStatus" TEXT,
    "targetDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "updatedByName" TEXT,
    "updatedByEmail" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closedByName" TEXT,
    "closedByEmail" TEXT,
    "closureReason" TEXT,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Risk_useCaseId_idx" ON "Risk"("useCaseId");

-- CreateIndex
CREATE INDEX "Risk_status_idx" ON "Risk"("status");

-- CreateIndex
CREATE INDEX "Risk_category_idx" ON "Risk"("category");

-- CreateIndex
CREATE INDEX "Risk_riskLevel_idx" ON "Risk"("riskLevel");

-- CreateIndex
CREATE INDEX "Risk_createdAt_idx" ON "Risk"("createdAt");

-- CreateIndex
CREATE INDEX "Iso42001AnnexInstance_assessmentId_idx" ON "Iso42001AnnexInstance"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001AnnexInstance_assessmentId_annexItemId_key" ON "Iso42001AnnexInstance"("assessmentId", "itemId");

-- AddForeignKey
ALTER TABLE "Iso42001AnnexInstance" ADD CONSTRAINT "Iso42001AnnexInstance_annexItemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Iso42001AnnexItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
