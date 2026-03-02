-- Add new governance framework scopes to LockScope enum
ALTER TYPE "LockScope" ADD VALUE 'GOVERNANCE_EU_AI_ACT';
ALTER TYPE "LockScope" ADD VALUE 'GOVERNANCE_ISO_42001';
ALTER TYPE "LockScope" ADD VALUE 'GOVERNANCE_UAE_AI';
