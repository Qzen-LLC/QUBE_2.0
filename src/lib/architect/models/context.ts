import { z } from "zod";
import {
  UseCaseCategory,
  DeploymentTarget,
  DataClassification,
  PillarScorecardSchema,
} from "./pillars";

// ── Sub-schemas for new enriched fields ──────────────────
export const EncryptionRequirementsSchema = z.object({
  atRest: z.boolean().nullish(),
  inTransit: z.boolean().nullish(),
  keyManagement: z.string().nullish(),
});
export type EncryptionRequirements = z.infer<typeof EncryptionRequirementsSchema>;

export const ComplianceCostEstimateSchema = z.object({
  setup: z.number().nullish(),
  annual: z.number().nullish(),
});
export type ComplianceCostEstimate = z.infer<typeof ComplianceCostEstimateSchema>;

export const BiasTestingSchema = z.object({
  required: z.boolean().nullish(),
  methodology: z.string().nullish(),
  frequency: z.string().nullish(),
});
export type BiasTesting = z.infer<typeof BiasTestingSchema>;

export const SlaRequirementsSchema = z.object({
  uptime: z.string().nullish(),
  latencyP99Ms: z.number().nullish(),
  throughputRps: z.number().nullish(),
});
export type SlaRequirements = z.infer<typeof SlaRequirementsSchema>;

export const StageGateSchema = z.object({
  gate: z.string().nullish(),
  owner: z.string().nullish(),
  criteria: z.string().nullish(),
});
export type StageGate = z.infer<typeof StageGateSchema>;

export const RemediationItemSchema = z.object({
  priority: z.string().nullish(),
  action: z.string().nullish(),
  owner: z.string().nullish(),
});
export type RemediationItem = z.infer<typeof RemediationItemSchema>;

export const IncidentEscalationSchema = z.object({
  severity: z.string().nullish(),
  escalateTo: z.string().nullish(),
  withinHours: z.number().nullish(),
});
export type IncidentEscalation = z.infer<typeof IncidentEscalationSchema>;

export const AssumptionLogEntrySchema = z.object({
  field: z.string().nullish(),
  assumed: z.string().nullish(),
  risk: z.string().nullish(),
});
export type AssumptionLogEntry = z.infer<typeof AssumptionLogEntrySchema>;

export const FollowUpQuestionSchema = z.object({
  pillar: z.string().nullish(),
  question: z.string().nullish(),
  impact: z.string().nullish(),
});
export type FollowUpQuestion = z.infer<typeof FollowUpQuestionSchema>;

export const ModelAlternativeSchema = z.object({
  model: z.string().nullish(),
  savingsPercent: z.number().nullish(),
});
export type ModelAlternative = z.infer<typeof ModelAlternativeSchema>;

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
  // New fields
  hasToolUse: z.boolean().nullish(),
  apiSurfaceExposure: z.string().nullish(),
  multiVendorCount: z.number().nullish(),
  infrastructureMaturityLevel: z.string().nullish(),
  networkBoundaryCrossings: z.number().nullish(),
  encryptionRequirements: EncryptionRequirementsSchema.nullish(),
  failoverStrategy: z.string().nullish(),
  deploymentStrategy: z.string().nullish(),
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
  // New fields
  costSensitivityLevel: z.string().nullish(),
  budgetCeilingUsdMonthly: z.number().nullish(),
  scalingProfile: z.string().nullish(),
  pilotRecommended: z.boolean().nullish(),
  strategicImportance: z.string().nullish(),
  costPerRequestEstimatedUsd: z.number().nullish(),
  costExplosionRiskMultiplier: z.number().nullish(),
  modelAlternativeCostDelta: z.array(ModelAlternativeSchema).nullish(),
});
export type BusinessContext = z.infer<typeof BusinessContextSchema>;

export const ResponsibleContextSchema = z.object({
  decisionImpactLevel: z.string().default("advisory"),
  explainabilityRequired: z.boolean().default(false),
  biasRiskFactors: z.array(z.string()).default([]),
  humanOversightModel: z.string().default("escalation_only"),
  affectedPopulation: z.string().nullish(),
  fairnessCriteria: z.string().nullish(),
  // New fields
  guardrailLayersRequired: z.array(z.string()).nullish(),
  evalPlatformHint: z.string().nullish(),
  humanReviewRequired: z.boolean().nullish(),
  protectedAttributes: z.array(z.string()).nullish(),
  fairnessMetricCategories: z.array(z.string()).nullish(),
  biasTesting: BiasTestingSchema.nullish(),
  transparencyObligations: z.array(z.string()).nullish(),
  conditionalApprovalConditions: z.array(z.string()).nullish(),
  stageGateRequirements: z.array(StageGateSchema).nullish(),
  remediationRoadmap: z.array(RemediationItemSchema).nullish(),
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
  // New fields
  regulatoryBurdenScore: z.number().nullish(),
  sensitiveDataFlowExists: z.boolean().nullish(),
  euAiActRiskCategory: z.string().nullish(),
  auditEnforcementLevel: z.string().nullish(),
  complianceCostEstimateUsd: ComplianceCostEstimateSchema.nullish(),
  vendorSupplyChainRiskLevel: z.string().nullish(),
  dataResidencyRequirements: z.array(z.string()).nullish(),
  authenticationModel: z.string().nullish(),
  secretsManagementRequired: z.boolean().nullish(),
  zeroTrustRequired: z.boolean().nullish(),
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
  // New fields
  dataPreparationCritical: z.boolean().nullish(),
  dataFreshnessGuardrailIntervalDays: z.number().nullish(),
  dataStalenessRisk: z.string().nullish(),
  observabilityRequired: z.boolean().nullish(),
  observabilityCostEstimateUsdMonthly: z.number().nullish(),
  slaRequirements: SlaRequirementsSchema.nullish(),
  incidentEscalationMatrix: z.array(IncidentEscalationSchema).nullish(),
  periodicReviewCadence: z.string().nullish(),
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
  // New root-level fields
  readinessBlockers: z.array(z.string()).nullish(),
  crossPillarConflicts: z.array(z.string()).nullish(),
  confidenceFactors: z.record(z.string()).nullish(),
  assumptionLog: z.array(AssumptionLogEntrySchema).nullish(),
  followUpQuestionsRequired: z.array(FollowUpQuestionSchema).nullish(),
  goNoGoRecommendation: z.string().nullish(),
});
export type EnrichedContext = z.infer<typeof EnrichedContextSchema>;
