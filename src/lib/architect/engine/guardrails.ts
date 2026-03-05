import { callLLMJson } from "./llm-client";
import type { EnrichedContext } from "../models/context";
import type {
  ThreatOutput,
  GuardrailsOutput,
  GuardrailItem,
  EvalMetric,
} from "../models/outputs";
import { GUARDRAILS_GENERATION_PROMPT } from "../prompts/generation";

export async function generateGuardrails(
  ctx: EnrichedContext,
  threats: ThreatOutput
): Promise<GuardrailsOutput> {
  const threatsSummary = threats.threats.map((t) => ({
    id: t.id,
    category: t.strideCategory,
    name: t.threatName,
    severity: t.severity,
  }));

  const prompt = GUARDRAILS_GENERATION_PROMPT.replace(
    "{context_json}",
    JSON.stringify(ctx, null, 2)
  ).replace("{threats_json}", JSON.stringify(threatsSummary, null, 2));

  const result = await callLLMJson<Record<string, unknown>>(prompt, {
    maxTokens: 4096,
    system: undefined,
  });

  const rawGuardrails = (result.guardrails as Record<string, unknown>[]) ?? [];
  const guardrails: GuardrailItem[] = rawGuardrails.map((g) => ({
    id: (g.id as string) ?? "GR-000",
    layer: (g.layer as string) ?? "input",
    name: (g.name as string) ?? "Unknown Guardrail",
    description: (g.description as string) ?? "",
    implementationGuidance: (g.implementation_guidance as string) ?? "",
    priority: (g.priority as string) ?? "should_have",
    sourceThreatIds: (g.source_threat_ids as string[]) ?? [],
    sourcePillar: (g.source_pillar as string) ?? "technical",
  }));

  const rawMetrics = (result.eval_metrics as Record<string, unknown>[]) ?? [];
  const evalMetrics: EvalMetric[] = rawMetrics.map((e) => ({
    id: (e.id as string) ?? "EVAL-000",
    layer: (e.layer as string) ?? "input",
    metricName: (e.metric_name as string) ?? "Unknown Metric",
    description: (e.description as string) ?? "",
    targetValue: e.target_value as string | undefined,
    measurementApproach: (e.measurement_approach as string) ?? "",
  }));

  return {
    coverageScore: (result.coverage_score as number) ?? 0,
    guardrails,
    evalMetrics,
    narrative: (result.narrative as string) ?? "",
  };
}
