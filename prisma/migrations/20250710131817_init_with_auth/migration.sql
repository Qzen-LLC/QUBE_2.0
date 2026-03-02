-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('IN_ASSESSMENT', 'APPROVED', 'REJECTED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "ApprovalAreaType" AS ENUM ('PROCUREMENT', 'LEGAL', 'GOVERNANCE', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('QZEN_ADMIN', 'ORG_ADMIN', 'ORG_USER', 'USER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "UseCase" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "proposedAISolution" TEXT NOT NULL,
    "currentState" TEXT NOT NULL,
    "desiredState" TEXT NOT NULL,
    "primaryStakeholders" TEXT[],
    "secondaryStakeholders" TEXT[],
    "successCriteria" TEXT[],
    "problemValidation" TEXT NOT NULL,
    "solutionHypothesis" TEXT NOT NULL,
    "keyAssumptions" TEXT[],
    "initialROI" TEXT NOT NULL,
    "confidenceLevel" INTEGER NOT NULL,
    "operationalImpactScore" INTEGER NOT NULL,
    "productivityImpactScore" INTEGER NOT NULL,
    "revenueImpactScore" INTEGER NOT NULL,
    "implementationComplexity" INTEGER NOT NULL,
    "estimatedTimeline" TEXT NOT NULL,
    "requiredResources" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "priority" TEXT,
    "stage" TEXT,
    "businessFunction" TEXT NOT NULL,
    "aiucId" SERIAL NOT NULL,

    CONSTRAINT "UseCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinOps" (
    "useCaseId" TEXT NOT NULL,
    "ROI" DOUBLE PRECISION NOT NULL,
    "netValue" DOUBLE PRECISION NOT NULL,
    "apiCostBase" DOUBLE PRECISION NOT NULL,
    "cumOpCost" DOUBLE PRECISION NOT NULL,
    "cumValue" DOUBLE PRECISION NOT NULL,
    "devCostBase" DOUBLE PRECISION NOT NULL,
    "infraCostBase" DOUBLE PRECISION NOT NULL,
    "opCostBase" DOUBLE PRECISION NOT NULL,
    "totalInvestment" DOUBLE PRECISION NOT NULL,
    "valueBase" DOUBLE PRECISION NOT NULL,
    "valueGrowthRate" DOUBLE PRECISION NOT NULL,
    "budgetRange" TEXT,

    CONSTRAINT "FinOps_pkey" PRIMARY KEY ("useCaseId")
);

-- CreateTable
CREATE TABLE "Assess" (
    "useCaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepsData" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assess_pkey" PRIMARY KEY ("useCaseId")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "governanceName" TEXT,
    "governanceStatus" TEXT,
    "governanceComment" TEXT,
    "riskName" TEXT,
    "riskStatus" TEXT,
    "riskComment" TEXT,
    "legalName" TEXT,
    "legalStatus" TEXT,
    "legalComment" TEXT,
    "businessFunction" TEXT,
    "businessName" TEXT,
    "businessStatus" TEXT,
    "businessComment" TEXT,
    "finalQualification" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "website" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "assessmentDate" TIMESTAMP(3),
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "VendorStatus" NOT NULL DEFAULT 'IN_ASSESSMENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "score" SMALLINT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalArea" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "area" "ApprovalAreaType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActTopic" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "EuAiActTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActSubtopic" (
    "id" TEXT NOT NULL,
    "subtopicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "EuAiActSubtopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "subtopicId" TEXT NOT NULL,

    CONSTRAINT "EuAiActQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActAnswer" (
    "id" TEXT NOT NULL,
    "answer" TEXT,
    "evidenceFiles" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "questionId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "EuAiActAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActAssessment" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EuAiActAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActControlCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "EuAiActControlCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActControlStruct" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "EuAiActControlStruct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActSubcontrolStruct" (
    "id" TEXT NOT NULL,
    "subcontrolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "controlId" TEXT NOT NULL,

    CONSTRAINT "EuAiActSubcontrolStruct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActControl" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "evidenceFiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "controlId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "EuAiActControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EuAiActSubcontrol" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "evidenceFiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subcontrolId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,

    CONSTRAINT "EuAiActSubcontrol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001Clause" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Iso42001Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001Subclause" (
    "id" TEXT NOT NULL,
    "subclauseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "questions" TEXT[],
    "evidenceExamples" TEXT[],
    "orderIndex" INTEGER NOT NULL,
    "clauseId" TEXT NOT NULL,

    CONSTRAINT "Iso42001Subclause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001SubclauseInstance" (
    "id" TEXT NOT NULL,
    "implementation" TEXT,
    "evidenceFiles" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subclauseId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,

    CONSTRAINT "Iso42001SubclauseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001Assessment" (
    "id" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Iso42001Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001AnnexCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Iso42001AnnexCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001AnnexItem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Iso42001AnnexItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Iso42001AnnexInstance" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "annexItemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "evidence" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Iso42001AnnexInstance_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "UseCase_aiucId_key" ON "UseCase"("aiucId");

-- CreateIndex
CREATE INDEX "UseCase_stage_idx" ON "UseCase"("stage");

-- CreateIndex
CREATE INDEX "UseCase_priority_idx" ON "UseCase"("priority");

-- CreateIndex
CREATE INDEX "UseCase_businessFunction_idx" ON "UseCase"("businessFunction");

-- CreateIndex
CREATE INDEX "UseCase_createdAt_idx" ON "UseCase"("createdAt");

-- CreateIndex
CREATE INDEX "UseCase_updatedAt_idx" ON "UseCase"("updatedAt");

-- CreateIndex
CREATE INDEX "UseCase_stage_priority_idx" ON "UseCase"("stage", "priority");

-- CreateIndex
CREATE INDEX "UseCase_businessFunction_stage_idx" ON "UseCase"("businessFunction", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_useCaseId_key" ON "Approval"("useCaseId");

-- CreateIndex
CREATE INDEX "Approval_governanceStatus_idx" ON "Approval"("governanceStatus");

-- CreateIndex
CREATE INDEX "Approval_riskStatus_idx" ON "Approval"("riskStatus");

-- CreateIndex
CREATE INDEX "Approval_legalStatus_idx" ON "Approval"("legalStatus");

-- CreateIndex
CREATE INDEX "Approval_businessStatus_idx" ON "Approval"("businessStatus");

-- CreateIndex
CREATE INDEX "Approval_finalQualification_idx" ON "Approval"("finalQualification");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- CreateIndex
CREATE INDEX "Vendor_createdAt_idx" ON "Vendor"("createdAt");

-- CreateIndex
CREATE INDEX "Vendor_overallScore_idx" ON "Vendor"("overallScore");

-- CreateIndex
CREATE INDEX "Vendor_category_status_idx" ON "Vendor"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentScore_vendorId_category_subcategory_key" ON "AssessmentScore"("vendorId", "category", "subcategory");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalArea_vendorId_area_key" ON "ApprovalArea"("vendorId", "area");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActTopic_topicId_key" ON "EuAiActTopic"("topicId");

-- CreateIndex
CREATE INDEX "EuAiActTopic_orderIndex_idx" ON "EuAiActTopic"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActSubtopic_subtopicId_key" ON "EuAiActSubtopic"("subtopicId");

-- CreateIndex
CREATE INDEX "EuAiActSubtopic_topicId_orderIndex_idx" ON "EuAiActSubtopic"("topicId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActQuestion_questionId_key" ON "EuAiActQuestion"("questionId");

-- CreateIndex
CREATE INDEX "EuAiActQuestion_subtopicId_orderIndex_idx" ON "EuAiActQuestion"("subtopicId", "orderIndex");

-- CreateIndex
CREATE INDEX "EuAiActAnswer_assessmentId_idx" ON "EuAiActAnswer"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActAnswer_questionId_assessmentId_key" ON "EuAiActAnswer"("questionId", "assessmentId");

-- CreateIndex
CREATE INDEX "EuAiActAssessment_status_idx" ON "EuAiActAssessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActAssessment_useCaseId_key" ON "EuAiActAssessment"("useCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActControlCategory_categoryId_key" ON "EuAiActControlCategory"("categoryId");

-- CreateIndex
CREATE INDEX "EuAiActControlCategory_orderIndex_idx" ON "EuAiActControlCategory"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActControlStruct_controlId_key" ON "EuAiActControlStruct"("controlId");

-- CreateIndex
CREATE INDEX "EuAiActControlStruct_categoryId_orderIndex_idx" ON "EuAiActControlStruct"("categoryId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActSubcontrolStruct_subcontrolId_key" ON "EuAiActSubcontrolStruct"("subcontrolId");

-- CreateIndex
CREATE INDEX "EuAiActSubcontrolStruct_controlId_orderIndex_idx" ON "EuAiActSubcontrolStruct"("controlId", "orderIndex");

-- CreateIndex
CREATE INDEX "EuAiActControl_assessmentId_idx" ON "EuAiActControl"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActControl_controlId_assessmentId_key" ON "EuAiActControl"("controlId", "assessmentId");

-- CreateIndex
CREATE INDEX "EuAiActSubcontrol_controlId_idx" ON "EuAiActSubcontrol"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "EuAiActSubcontrol_subcontrolId_controlId_key" ON "EuAiActSubcontrol"("subcontrolId", "controlId");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001Clause_clauseId_key" ON "Iso42001Clause"("clauseId");

-- CreateIndex
CREATE INDEX "Iso42001Clause_orderIndex_idx" ON "Iso42001Clause"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001Subclause_subclauseId_key" ON "Iso42001Subclause"("subclauseId");

-- CreateIndex
CREATE INDEX "Iso42001Subclause_clauseId_orderIndex_idx" ON "Iso42001Subclause"("clauseId", "orderIndex");

-- CreateIndex
CREATE INDEX "Iso42001SubclauseInstance_assessmentId_idx" ON "Iso42001SubclauseInstance"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001SubclauseInstance_subclauseId_assessmentId_key" ON "Iso42001SubclauseInstance"("subclauseId", "assessmentId");

-- CreateIndex
CREATE INDEX "Iso42001Assessment_status_idx" ON "Iso42001Assessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001Assessment_useCaseId_key" ON "Iso42001Assessment"("useCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001AnnexCategory_categoryId_key" ON "Iso42001AnnexCategory"("categoryId");

-- CreateIndex
CREATE INDEX "Iso42001AnnexCategory_orderIndex_idx" ON "Iso42001AnnexCategory"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001AnnexItem_itemId_key" ON "Iso42001AnnexItem"("itemId");

-- CreateIndex
CREATE INDEX "Iso42001AnnexItem_categoryId_orderIndex_idx" ON "Iso42001AnnexItem"("categoryId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Iso42001AnnexInstance_assessmentId_annexItemId_key" ON "Iso42001AnnexInstance"("assessmentId", "annexItemId");

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

-- AddForeignKey
ALTER TABLE "FinOps" ADD CONSTRAINT "FinOps_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assess" ADD CONSTRAINT "Assess_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalArea" ADD CONSTRAINT "ApprovalArea_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActSubtopic" ADD CONSTRAINT "EuAiActSubtopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "EuAiActTopic"("topicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActQuestion" ADD CONSTRAINT "EuAiActQuestion_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "EuAiActSubtopic"("subtopicId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActAnswer" ADD CONSTRAINT "EuAiActAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "EuAiActQuestion"("questionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActAnswer" ADD CONSTRAINT "EuAiActAnswer_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "EuAiActAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActAssessment" ADD CONSTRAINT "EuAiActAssessment_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActControlStruct" ADD CONSTRAINT "EuAiActControlStruct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EuAiActControlCategory"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActSubcontrolStruct" ADD CONSTRAINT "EuAiActSubcontrolStruct_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "EuAiActControlStruct"("controlId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActControl" ADD CONSTRAINT "EuAiActControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "EuAiActControlStruct"("controlId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActControl" ADD CONSTRAINT "EuAiActControl_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "EuAiActAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActSubcontrol" ADD CONSTRAINT "EuAiActSubcontrol_subcontrolId_fkey" FOREIGN KEY ("subcontrolId") REFERENCES "EuAiActSubcontrolStruct"("subcontrolId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EuAiActSubcontrol" ADD CONSTRAINT "EuAiActSubcontrol_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "EuAiActControl"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001Subclause" ADD CONSTRAINT "Iso42001Subclause_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Iso42001Clause"("clauseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001SubclauseInstance" ADD CONSTRAINT "Iso42001SubclauseInstance_subclauseId_fkey" FOREIGN KEY ("subclauseId") REFERENCES "Iso42001Subclause"("subclauseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001SubclauseInstance" ADD CONSTRAINT "Iso42001SubclauseInstance_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Iso42001Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001Assessment" ADD CONSTRAINT "Iso42001Assessment_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001AnnexItem" ADD CONSTRAINT "Iso42001AnnexItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Iso42001AnnexCategory"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001AnnexInstance" ADD CONSTRAINT "Iso42001AnnexInstance_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Iso42001Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Iso42001AnnexInstance" ADD CONSTRAINT "Iso42001AnnexInstance_annexItemId_fkey" FOREIGN KEY ("annexItemId") REFERENCES "Iso42001AnnexItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
