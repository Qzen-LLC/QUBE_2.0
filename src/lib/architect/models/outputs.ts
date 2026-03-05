import { z } from "zod";

// ── FinOps Output ──────────────────────────────────────
export const CostLineItemSchema = z.object({
  category: z.string(),
  description: z.string(),
  monthlyCostLow: z.number(),
  monthlyCostMid: z.number(),
  monthlyCostHigh: z.number(),
  unit: z.string().default("USD/month"),
  calculationBasis: z.string(),
  sourcePillar: z.string().default("technical"),
});
export type CostLineItem = z.infer<typeof CostLineItemSchema>;

export const FinOpsProjectionSchema = z.object({
  month: z.number().int(),
  totalLow: z.number(),
  totalMid: z.number(),
  totalHigh: z.number(),
});
export type FinOpsProjection = z.infer<typeof FinOpsProjectionSchema>;

export const FinOpsOutputSchema = z.object({
  summaryMonthlyLow: z.number(),
  summaryMonthlyMid: z.number(),
  summaryMonthlyHigh: z.number(),
  lineItems: z.array(CostLineItemSchema).default([]),
  projections12m: z.array(FinOpsProjectionSchema).default([]),
  oneTimeCosts: z.array(CostLineItemSchema).default([]),
  assumptions: z.array(z.string()).default([]),
  dataPrepCosts: CostLineItemSchema.nullish(),
  costUnderAttackScenario: z.number().nullish(),
  narrative: z.string().default(""),
});
export type FinOpsOutput = z.infer<typeof FinOpsOutputSchema>;

// ── Risk Output ────────────────────────────────────────
export const RiskItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  name: z.string(),
  description: z.string(),
  probability: z.string(),
  impact: z.string(),
  severity: z.string(),
  sourcePillar: z.string(),
  mitigation: z.string(),
  ownerSuggestion: z.string().default(""),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

export const RiskOutputSchema = z.object({
  riskPosture: z.string(),
  totalRisks: z.number().int(),
  criticalRisks: z.number().int(),
  risks: z.array(RiskItemSchema).default([]),
  mitigationRoadmap: z.array(z.string()).default([]),
  narrative: z.string().default(""),
});
export type RiskOutput = z.infer<typeof RiskOutputSchema>;

// ── Threat Model Output ───────────────────────────────
export const ThreatItemSchema = z.object({
  id: z.string(),
  strideCategory: z.string(),
  threatName: z.string(),
  description: z.string(),
  attackVector: z.string(),
  severity: z.string(),
  affectedComponents: z.array(z.string()).default([]),
  sourcePillar: z.string(),
  recommendedControls: z.array(z.string()).default([]),
});
export type ThreatItem = z.infer<typeof ThreatItemSchema>;

export const ThreatOutputSchema = z.object({
  threatPosture: z.string(),
  totalThreats: z.number().int(),
  criticalThreats: z.number().int(),
  threats: z.array(ThreatItemSchema).default([]),
  attackSurfaceSummary: z.string().default(""),
  narrative: z.string().default(""),
});
export type ThreatOutput = z.infer<typeof ThreatOutputSchema>;

// ── Guardrails & Evals Output ─────────────────────────
export const GuardrailItemSchema = z.object({
  id: z.string(),
  layer: z.string(),
  name: z.string(),
  description: z.string(),
  implementationGuidance: z.string(),
  priority: z.string(),
  sourceThreatIds: z.array(z.string()).default([]),
  sourcePillar: z.string(),
});
export type GuardrailItem = z.infer<typeof GuardrailItemSchema>;

export const EvalMetricSchema = z.object({
  id: z.string(),
  layer: z.string(),
  metricName: z.string(),
  description: z.string(),
  targetValue: z.string().nullish(),
  measurementApproach: z.string(),
});
export type EvalMetric = z.infer<typeof EvalMetricSchema>;

export const GuardrailsOutputSchema = z.object({
  coverageScore: z.number().default(0),
  guardrails: z.array(GuardrailItemSchema).default([]),
  evalMetrics: z.array(EvalMetricSchema).default([]),
  narrative: z.string().default(""),
});
export type GuardrailsOutput = z.infer<typeof GuardrailsOutputSchema>;

// ── Combined Output ────────────────────────────────────
export const ArchitectureOutputSchema = z.object({
  useCaseId: z.string(),
  useCaseName: z.string(),
  tier: z.string().default("tier_2"),
  finops: FinOpsOutputSchema,
  risk: RiskOutputSchema,
  threat: ThreatOutputSchema,
  guardrails: GuardrailsOutputSchema,
  executiveSummary: z.string().default(""),
});
export type ArchitectureOutput = z.infer<typeof ArchitectureOutputSchema>;
