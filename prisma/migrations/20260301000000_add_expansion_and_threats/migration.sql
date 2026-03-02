-- CreateTable
CREATE TABLE "AssessmentExpansion" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requirementsProfile" JSONB,
    "technicalProfile" JSONB,
    "businessProfile" JSONB,
    "responsibleEthicalProfile" JSONB,
    "legalRegulatoryProfile" JSONB,
    "dataReadinessProfile" JSONB,
    "finopsProfile" JSONB,
    "coreAnswerCount" INTEGER NOT NULL DEFAULT 0,
    "expandedFieldCount" INTEGER NOT NULL DEFAULT 0,
    "overallConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "modelUsed" TEXT,
    "tokenUsage" JSONB,
    "expansionDuration" INTEGER,
    "userReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "userOverrides" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentExpansion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Threat" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "likelihood" TEXT NOT NULL,
    "attackVector" TEXT,
    "affectedAsset" TEXT,
    "mitigationPlan" TEXT,
    "mitreTechniqueIds" TEXT[],
    "justification" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'llm-assessment',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdByEmail" TEXT,

    CONSTRAINT "Threat_pkey" PRIMARY KEY ("id")
);

-- Add coreQuestion to QuestionTemplate
ALTER TABLE "QuestionTemplate" ADD COLUMN "coreQuestion" BOOLEAN NOT NULL DEFAULT false;

-- Add coreQuestion to Question
ALTER TABLE "Question" ADD COLUMN "coreQuestion" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentExpansion_useCaseId_key" ON "AssessmentExpansion"("useCaseId");

-- CreateIndex
CREATE INDEX "AssessmentExpansion_status_idx" ON "AssessmentExpansion"("status");

-- CreateIndex
CREATE INDEX "Threat_useCaseId_idx" ON "Threat"("useCaseId");

-- CreateIndex
CREATE INDEX "Threat_category_idx" ON "Threat"("category");

-- AddForeignKey
ALTER TABLE "AssessmentExpansion" ADD CONSTRAINT "AssessmentExpansion_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Threat" ADD CONSTRAINT "Threat_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
