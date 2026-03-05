import { z } from "zod";

// ── FinOps Reconciliation Models ──────────────────────

export const VarianceStatus = z.enum([
  "within_budget",
  "over_budget",
  "under_budget",
  "anomaly",
]);
export type VarianceStatus = z.infer<typeof VarianceStatus>;

export const CostVarianceLineSchema = z.object({
  category: z.string(),
  projectedMonthly: z.number(),
  actualMonthly: z.number(),
  varianceAmount: z.number().default(0),
  variancePercent: z.number().default(0),
  status: VarianceStatus.default("within_budget"),
  sourcePillar: z.string().default("technical"),
  notes: z.string().default(""),
});
export type CostVarianceLine = z.infer<typeof CostVarianceLineSchema>;

export function computeVariance(line: CostVarianceLine): CostVarianceLine {
  if (line.projectedMonthly > 0) {
    const varianceAmount = line.actualMonthly - line.projectedMonthly;
    const variancePercent = Math.round(
      (varianceAmount / line.projectedMonthly) * 100 * 100
    ) / 100;
    let status: VarianceStatus = "within_budget";
    if (variancePercent > 20) status = "anomaly";
    else if (variancePercent > 5) status = "over_budget";
    else if (variancePercent < -5) status = "under_budget";
    return { ...line, varianceAmount, variancePercent, status };
  }
  return line;
}

export const ReconciliationOutputSchema = z.object({
  useCaseId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  varianceLines: z.array(CostVarianceLineSchema).default([]),
  totalProjected: z.number().default(0),
  totalActual: z.number().default(0),
  totalVarianceAmount: z.number().default(0),
  totalVariancePercent: z.number().default(0),
  anomalies: z.array(z.record(z.unknown())).default([]),
  trendData: z.array(z.record(z.unknown())).default([]),
  narrative: z.string().default(""),
  reconciledAt: z.string().default(() => new Date().toISOString()),
});
export type ReconciliationOutput = z.infer<typeof ReconciliationOutputSchema>;

// ── Evals Monitoring Models ───────────────────────────

export const EvalPlatform = z.enum(["langfuse", "langsmith"]);
export type EvalPlatform = z.infer<typeof EvalPlatform>;

export const GuardrailEvalResultSchema = z.object({
  guardrailName: z.string(),
  layer: z.string(),
  metricName: z.string(),
  targetValue: z.string().nullish(),
  currentValue: z.string().nullish(),
  passRate: z.number().default(0),
  sampleCount: z.number().int().default(0),
  status: z.string().default("unknown"),
  lastEvaluated: z.string().default(""),
});
export type GuardrailEvalResult = z.infer<typeof GuardrailEvalResultSchema>;

export const EvalsMonitoringOutputSchema = z.object({
  projectId: z.string(),
  platform: EvalPlatform,
  guardrailResults: z.array(GuardrailEvalResultSchema).default([]),
  overallHealthScore: z.number().default(0),
  degradedGuardrails: z.array(z.string()).default([]),
  failingGuardrails: z.array(z.string()).default([]),
  lastSync: z.string().default(() => new Date().toISOString()),
  alerts: z.array(z.record(z.unknown())).default([]),
});
export type EvalsMonitoringOutput = z.infer<typeof EvalsMonitoringOutputSchema>;

// ── Production Configuration ──────────────────────────

export const AWSConfigSchema = z.object({
  region: z.string().default("us-east-1"),
  costExplorerEnabled: z.boolean().default(false),
  costAllocationTags: z.array(z.string()).default([]),
});
export type AWSConfig = z.infer<typeof AWSConfigSchema>;

export const LangfuseConfigSchema = z.object({
  host: z.string().default("https://cloud.langfuse.com"),
  enabled: z.boolean().default(false),
});
export type LangfuseConfig = z.infer<typeof LangfuseConfigSchema>;

export const LangSmithConfigSchema = z.object({
  projectName: z.string().nullish(),
  enabled: z.boolean().default(false),
});
export type LangSmithConfig = z.infer<typeof LangSmithConfigSchema>;

export const ProductionConfigSchema = z.object({
  aws: AWSConfigSchema.default({}),
  langfuse: LangfuseConfigSchema.default({}),
  langsmith: LangSmithConfigSchema.default({}),
  configured: z.boolean().default(false),
});
export type ProductionConfig = z.infer<typeof ProductionConfigSchema>;
