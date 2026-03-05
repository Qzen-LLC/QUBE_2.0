import { z } from "zod";

// ── Enums ──────────────────────────────────────────────
export const UseCaseCategory = z.enum([
  "rag",
  "agent",
  "copilot",
  "content_generation",
  "code_generation",
  "multimodal",
  "fine_tuned_model",
  "conversational_ai",
]);
export type UseCaseCategory = z.infer<typeof UseCaseCategory>;

export const DeploymentTarget = z.enum([
  "aws",
  "azure",
  "gcp",
  "on_prem",
  "hybrid",
]);
export type DeploymentTarget = z.infer<typeof DeploymentTarget>;

export const DataClassification = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);
export type DataClassification = z.infer<typeof DataClassification>;

export const DecisionImpact = z.enum([
  "informational",
  "advisory",
  "decision_support",
  "autonomous",
]);
export type DecisionImpact = z.infer<typeof DecisionImpact>;

export const HumanOversight = z.enum([
  "none",
  "escalation_only",
  "review_before_action",
  "always_in_loop",
]);
export type HumanOversight = z.infer<typeof HumanOversight>;

export const PillarScore = z.enum(["green", "amber", "red", "blocker"]);
export type PillarScore = z.infer<typeof PillarScore>;

export const PipelineMaturity = z.enum([
  "none",
  "ad_hoc",
  "managed",
  "automated",
  "optimized",
]);
export type PipelineMaturity = z.infer<typeof PipelineMaturity>;

// ── Pillar 1: Technical ────────────────────────────────
export const TechnicalPillarSchema = z.object({
  useCaseCategory: UseCaseCategory,
  description: z.string(),
  targetModel: z.string().nullish(),
  expectedLatencyMs: z.number().int().nullish(),
  contextWindowNeeds: z.string().nullish(),
  orchestrationComplexity: z.string().nullish(),
  deploymentTarget: DeploymentTarget.nullish(),
  toolUseRequired: z.boolean().default(false),
  multiModal: z.boolean().default(false),
  existingInfrastructure: z.string().nullish(),
});
export type TechnicalPillar = z.infer<typeof TechnicalPillarSchema>;

// ── Pillar 2: Business ─────────────────────────────────
export const BusinessPillarSchema = z.object({
  businessOutcome: z.string(),
  targetUsers: z.string(),
  isCustomerFacing: z.boolean().default(false),
  estimatedDailyUsers: z.number().int().nullish(),
  estimatedDailyRequests: z.number().int().nullish(),
  roiHypothesis: z.string().nullish(),
  operationalReadiness: z.string().nullish(),
  changeManagementNeeds: z.string().nullish(),
  growthRateMonthly: z.number().default(0.05),
});
export type BusinessPillar = z.infer<typeof BusinessPillarSchema>;

// ── Pillar 3: Responsible / Ethical ────────────────────
export const ResponsiblePillarSchema = z.object({
  affectedPopulation: z.string().nullish(),
  decisionImpact: DecisionImpact.default("advisory"),
  explainabilityRequired: z.boolean().default(false),
  biasRiskFactors: z.string().nullish(),
  humanOversight: HumanOversight.default("escalation_only"),
  transparencyRequirements: z.string().nullish(),
  fairnessCriteria: z.string().nullish(),
});
export type ResponsiblePillar = z.infer<typeof ResponsiblePillarSchema>;

// ── Pillar 4: Legal & Regulatory ───────────────────────
export const LegalPillarSchema = z.object({
  regulations: z.array(z.string()).default([]),
  governanceFrameworks: z.array(z.string()).default([]),
  dataClassification: DataClassification.default("internal"),
  piiPresent: z.boolean().default(false),
  phiPresent: z.boolean().default(false),
  crossBorderDataFlows: z.boolean().default(false),
  ipCopyrightConcerns: z.string().nullish(),
  liabilityModel: z.string().nullish(),
  auditRequired: z.boolean().default(false),
  consentRequirements: z.string().nullish(),
});
export type LegalPillar = z.infer<typeof LegalPillarSchema>;

// ── Pillar 5: Data Readiness ──────────────────────────
export const DataReadinessPillarSchema = z.object({
  dataSources: z.array(z.string()).default([]),
  dataQualityScore: z.string().nullish(),
  goldenDatasetExists: z.boolean().default(false),
  goldenDatasetSize: z.number().int().nullish(),
  labelingStatus: z.string().nullish(),
  dataFreshness: z.string().nullish(),
  corpusDocumentCount: z.number().int().nullish(),
  pipelineMaturity: PipelineMaturity.default("none"),
});
export type DataReadinessPillar = z.infer<typeof DataReadinessPillarSchema>;

// ── Combined Input ─────────────────────────────────────
export const UseCaseInputSchema = z.object({
  name: z.string(),
  archetypeId: z.string().nullish(),
  technical: TechnicalPillarSchema,
  business: BusinessPillarSchema,
  responsible: ResponsiblePillarSchema,
  legal: LegalPillarSchema,
  dataReadiness: DataReadinessPillarSchema,
});
export type UseCaseInput = z.infer<typeof UseCaseInputSchema>;

// ── Pillar Scorecard ───────────────────────────────────
export const PillarScorecardSchema = z.object({
  technical: PillarScore,
  business: PillarScore,
  responsible: PillarScore,
  legal: PillarScore,
  dataReadiness: PillarScore,
  conflicts: z.array(z.string()).default([]),
  proceed: z.boolean().default(true),
  blockers: z.array(z.string()).default([]),
});
export type PillarScorecard = z.infer<typeof PillarScorecardSchema>;
