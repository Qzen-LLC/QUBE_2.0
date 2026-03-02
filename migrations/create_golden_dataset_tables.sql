-- Migration: Create Golden Dataset Tables
-- Created: 2025-01-17
-- Purpose: Create GoldenDataset, GoldenEntry, and GoldenReview tables for golden dataset functionality

-- Create GoldenDataset table
CREATE TABLE IF NOT EXISTS "GoldenDataset" (
  "id" TEXT PRIMARY KEY,
  "useCaseId" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "statistics" JSONB,
  "qualityMetrics" JSONB,
  "validationStatus" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3)
);

-- Create indexes for GoldenDataset
CREATE INDEX IF NOT EXISTS "GoldenDataset_createdAt_idx" ON "GoldenDataset"("createdAt");
CREATE INDEX IF NOT EXISTS "GoldenDataset_publishedAt_idx" ON "GoldenDataset"("publishedAt");
CREATE INDEX IF NOT EXISTS "GoldenDataset_useCaseId_idx" ON "GoldenDataset"("useCaseId");

-- Create GoldenEntry table
CREATE TABLE IF NOT EXISTS "GoldenEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "datasetId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "inputSpec" JSONB NOT NULL,
  "expectedOutputs" JSONB NOT NULL,
  "metadata" JSONB NOT NULL,
  "quality" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "previousVersions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoldenEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "GoldenDataset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for GoldenEntry
CREATE INDEX IF NOT EXISTS "GoldenEntry_datasetId_idx" ON "GoldenEntry"("datasetId");
CREATE INDEX IF NOT EXISTS "GoldenEntry_category_idx" ON "GoldenEntry"("category");
CREATE INDEX IF NOT EXISTS "GoldenEntry_createdAt_idx" ON "GoldenEntry"("createdAt");

-- Create GoldenReview table
CREATE TABLE IF NOT EXISTS "GoldenReview" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entryId" TEXT NOT NULL,
  "reviewer" TEXT NOT NULL,
  "scores" JSONB NOT NULL,
  "decision" TEXT NOT NULL,
  "comments" TEXT,
  "suggestions" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoldenReview_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "GoldenEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for GoldenReview
CREATE INDEX IF NOT EXISTS "GoldenReview_entryId_idx" ON "GoldenReview"("entryId");
CREATE INDEX IF NOT EXISTS "GoldenReview_reviewer_idx" ON "GoldenReview"("reviewer");
CREATE INDEX IF NOT EXISTS "GoldenReview_timestamp_idx" ON "GoldenReview"("timestamp");

-- Create trigger to auto-update updatedAt for GoldenDataset
CREATE OR REPLACE FUNCTION update_golden_dataset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER golden_dataset_updated_at
BEFORE UPDATE ON "GoldenDataset"
FOR EACH ROW
EXECUTE FUNCTION update_golden_dataset_updated_at();

-- Create trigger to auto-update updatedAt for GoldenEntry
CREATE OR REPLACE FUNCTION update_golden_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER golden_entry_updated_at
BEFORE UPDATE ON "GoldenEntry"
FOR EACH ROW
EXECUTE FUNCTION update_golden_entry_updated_at();
