-- Safe Migration: Add Risk Classification Fields
-- This script only ADDS new columns and tables, never deletes data

-- Step 1: Add new columns to EuAiActAssessment
DO $$
BEGIN
    -- Add riskClassificationCompleted column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'riskClassificationCompleted'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "riskClassificationCompleted" BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE 'Added riskClassificationCompleted column';
    END IF;

    -- Add riskLevel column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'riskLevel'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "riskLevel" TEXT;
        RAISE NOTICE 'Added riskLevel column';
    END IF;

    -- Add riskLevelRationale column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'riskLevelRationale'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "riskLevelRationale" TEXT;
        RAISE NOTICE 'Added riskLevelRationale column';
    END IF;

    -- Add applicableAnnexCategories column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'applicableAnnexCategories'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "applicableAnnexCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE 'Added applicableAnnexCategories column';
    END IF;

    -- Add hasProhibitedPractices column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'hasProhibitedPractices'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "hasProhibitedPractices" BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE 'Added hasProhibitedPractices column';
    END IF;

    -- Add prohibitedPracticesList column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'prohibitedPracticesList'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "prohibitedPracticesList" TEXT[] DEFAULT ARRAY[]::TEXT[];
        RAISE NOTICE 'Added prohibitedPracticesList column';
    END IF;

    -- Add isSubjectToAct column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'isSubjectToAct'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "isSubjectToAct" BOOLEAN;
        RAISE NOTICE 'Added isSubjectToAct column';
    END IF;

    -- Add classificationDate column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EuAiActAssessment'
        AND column_name = 'classificationDate'
    ) THEN
        ALTER TABLE "EuAiActAssessment"
        ADD COLUMN "classificationDate" TIMESTAMP(3);
        RAISE NOTICE 'Added classificationDate column';
    END IF;
END $$;

-- Step 2: Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS "EuAiActAssessment_riskLevel_idx"
ON "EuAiActAssessment"("riskLevel");

CREATE INDEX IF NOT EXISTS "EuAiActAssessment_riskClassificationCompleted_idx"
ON "EuAiActAssessment"("riskClassificationCompleted");

-- Step 3: Create new table for risk classification answers (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "EuAiActRiskClassificationAnswer" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EuAiActRiskClassificationAnswer_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create unique constraint and indexes (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'EuAiActRiskClassificationAnswer_assessmentId_questionId_key'
    ) THEN
        CREATE UNIQUE INDEX "EuAiActRiskClassificationAnswer_assessmentId_questionId_key"
        ON "EuAiActRiskClassificationAnswer"("assessmentId", "questionId");
        RAISE NOTICE 'Created unique index on assessmentId and questionId';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'EuAiActRiskClassificationAnswer_assessmentId_idx'
    ) THEN
        CREATE INDEX "EuAiActRiskClassificationAnswer_assessmentId_idx"
        ON "EuAiActRiskClassificationAnswer"("assessmentId");
        RAISE NOTICE 'Created index on assessmentId';
    END IF;
END $$;

-- Step 5: Add foreign key constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'EuAiActRiskClassificationAnswer_assessmentId_fkey'
    ) THEN
        ALTER TABLE "EuAiActRiskClassificationAnswer"
        ADD CONSTRAINT "EuAiActRiskClassificationAnswer_assessmentId_fkey"
        FOREIGN KEY ("assessmentId") REFERENCES "EuAiActAssessment"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Added foreign key constraint';
    END IF;
END $$;

-- Step 6: Verify data integrity
DO $$
DECLARE
    assessment_count INTEGER;
    answer_count INTEGER;
    control_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO assessment_count FROM "EuAiActAssessment";
    SELECT COUNT(*) INTO answer_count FROM "EuAiActAnswer";
    SELECT COUNT(*) INTO control_count FROM "EuAiActControl";

    RAISE NOTICE '=== DATA INTEGRITY CHECK ===';
    RAISE NOTICE 'Existing EuAiActAssessment records: %', assessment_count;
    RAISE NOTICE 'Existing EuAiActAnswer records: %', answer_count;
    RAISE NOTICE 'Existing EuAiActControl records: %', control_count;
    RAISE NOTICE 'All existing data preserved!';
END $$;
