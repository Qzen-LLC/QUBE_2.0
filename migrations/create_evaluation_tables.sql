-- Migration: Create Evaluation Tables
-- Created: 2025-01-17
-- Purpose: Create Evaluation and EvaluationResult tables for evaluation functionality

-- Create Evaluation table
CREATE TABLE IF NOT EXISTS "Evaluation" (
  "id" TEXT PRIMARY KEY,
  "useCaseId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "configuration" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "summary" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for Evaluation
CREATE INDEX IF NOT EXISTS "Evaluation_useCaseId_idx" ON "Evaluation"("useCaseId");
CREATE INDEX IF NOT EXISTS "Evaluation_status_idx" ON "Evaluation"("status");
CREATE INDEX IF NOT EXISTS "Evaluation_createdAt_idx" ON "Evaluation"("createdAt");

-- Create EvaluationResult table
CREATE TABLE IF NOT EXISTS "EvaluationResult" (
  "id" TEXT PRIMARY KEY,
  "evaluationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "testType" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "expectedOutput" JSONB,
  "actualOutput" JSONB,
  "metrics" JSONB NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "severity" TEXT,
  "details" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvaluationResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for EvaluationResult
CREATE INDEX IF NOT EXISTS "EvaluationResult_evaluationId_idx" ON "EvaluationResult"("evaluationId");
CREATE INDEX IF NOT EXISTS "EvaluationResult_category_idx" ON "EvaluationResult"("category");
CREATE INDEX IF NOT EXISTS "EvaluationResult_passed_idx" ON "EvaluationResult"("passed");
CREATE INDEX IF NOT EXISTS "EvaluationResult_timestamp_idx" ON "EvaluationResult"("timestamp");

-- Create trigger to auto-update updatedAt for Evaluation
CREATE OR REPLACE FUNCTION update_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evaluation_updated_at
BEFORE UPDATE ON "Evaluation"
FOR EACH ROW
EXECUTE FUNCTION update_evaluation_updated_at();
