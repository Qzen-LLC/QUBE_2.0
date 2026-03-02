-- AlterTable
ALTER TABLE "QuestionTemplate" ADD COLUMN IF NOT EXISTS "quickAssessment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "quickAssessment" BOOLEAN NOT NULL DEFAULT false;
