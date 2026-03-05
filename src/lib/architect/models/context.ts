import { z } from "zod";
import {
  UseCaseCategory,
  DeploymentTarget,
  DataClassification,
  PillarScorecardSchema,
} from "./pillars";

export const ComponentPricingSchema = z.object({
  inputPerMtok: z.number().nullish(),
  outputPerMtok: z.number().nullish(),
  perMillionVectors: z.number().nullish(),
  monthlyBase: z.number().nullish(),
  perRequest: z.number().nullish(),
});
export type ComponentPricing = z.infer<typeof ComponentPricingSchema>;

export const ArchitectureComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  provider: z.string(),
  modelOrService: z.string(),
  pricing: ComponentPricingSchema,
  notes: z.string().nullish(),
});
export type ArchitectureComponent = z.infer<typeof ArchitectureComponentSchema>;

export const DataFlowSchema = z.object({
  source: z.string(),
  target: z.string(),
  dataType: z.string(),
  volumeEstimate: z.string().nullish(),
});
export type DataFlow = z.infer<typeof DataFlowSchema>;

export const TechnicalContextSchema = z.object({
  category: UseCaseCategory,
  archetype: z.string(),
  components: z.array(ArchitectureComponentSchema).default([]),
  dataFlows: z.array(DataFlowSchema).default([]),
  deploymentTarget: DeploymentTarget.default("aws"),
  region: z.string().default("us-east-1"),
  topology: z.string().default("multi-az"),
  latencyTargetMs: z.number().int().default(3000),
  orchestrationPattern: z.string().default("simple_chain"),
});
export type TechnicalContext = z.infer<typeof TechnicalContextSchema>;

export const BusinessContextSchema = z.object({
  businessOutcome: z.string(),
  targetUsers: z.string(),
  isCustomerFacing: z.boolean().default(false),
  dailyRequests: z.number().int().default(1000),
  avgInputTokens: z.number().int().default(800),
  avgOutputTokens: z.number().int().default(600),
  growthRateMonthly: z.number().default(0.05),
  roiHypothesis: z.string().nullish(),
  operationalReadinessScore: z.string().nullish(),
});
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

export const ResponsibleContextSchema = z.object({
  decisionImpactLevel: z.string().default("advisory"),
  explainabilityRequired: z.boolean().default(false),
  biasRiskFactors: z.array(z.string()).default([]),
  humanOversightModel: z.string().default("escalation_only"),
  affectedPopulation: z.string().nullish(),
  fairnessCriteria: z.string().nullish(),
});
export type ResponsibleContext = z.infer<typeof ResponsibleContextSchema>;

export const LegalContextSchema = z.object({
  regulations: z.array(z.string()).default([]),
  dataClassification: DataClassification.default("internal"),
  piiPresent: z.boolean().default(false),
  phiPresent: z.boolean().default(false),
  auditRequired: z.boolean().default(false),
  crossBorderFlows: z.boolean().default(false),
  liabilityModel: z.string().nullish(),
  ipConcerns: z.string().nullish(),
});
export type LegalContext = z.infer<typeof LegalContextSchema>;

export const DataReadinessContextSchema = z.object({
  dataSources: z.array(z.string()).default([]),
  qualityScore: z.string().default("unknown"),
  goldenDatasetExists: z.boolean().default(false),
  goldenDatasetSize: z.number().int().nullish(),
  labelingStatus: z.string().default("none"),
  freshness: z.string().default("static"),
  corpusDocumentCount: z.number().int().nullish(),
  pipelineMaturity: z.string().default("none"),
});
export type DataReadinessContext = z.infer<typeof DataReadinessContextSchema>;

export const EnrichedContextSchema = z.object({
  useCaseId: z.string(),
  useCaseName: z.string(),
  archetype: z.string(),
  confidence: z.number().min(0).max(1).default(0),
  pillarScores: PillarScorecardSchema,
  technical: TechnicalContextSchema,
  business: BusinessContextSchema,
  responsible: ResponsibleContextSchema,
  legal: LegalContextSchema,
  dataReadiness: DataReadinessContextSchema,
  overallRiskPosture: z.string().default("medium"),
  estimatedComplexity: z.string().default("moderate"),
  recommendedTier: z.string().default("tier_2"),
});
export type EnrichedContext = z.infer<typeof EnrichedContextSchema>;
