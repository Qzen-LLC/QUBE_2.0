import { callLLMJson } from "./llm-client";
import type { EnrichedContext } from "../models/context";
import type { RiskOutput, RiskItem } from "../models/outputs";
import { RISK_GENERATION_PROMPT } from "../prompts/generation";

export async function generateRisks(
  ctx: EnrichedContext
): Promise<RiskOutput> {
  const prompt = RISK_GENERATION_PROMPT.replace(
    "{context_json}",
    JSON.stringify(ctx, null, 2)
  );

  const result = await callLLMJson<Record<string, unknown>>(prompt, {
    maxTokens: 4096,
    system: undefined,
  });

  const rawRisks = (result.risks as Record<string, unknown>[]) ?? [];
  const risks: RiskItem[] = rawRisks.map((r) => ({
    id: (r.id as string) ?? "RISK-000",
    category: (r.category as string) ?? "technical",
    name: (r.name as string) ?? "Unknown Risk",
    description: (r.description as string) ?? "",
    probability: (r.probability as string) ?? "medium",
    impact: (r.impact as string) ?? "medium",
    severity: (r.severity as string) ?? "medium",
    sourcePillar: (r.source_pillar as string) ?? "technical",
    mitigation: (r.mitigation as string) ?? "",
    ownerSuggestion: (r.owner_suggestion as string) ?? "",
  }));

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const risk of risks) {
    const sev = risk.severity.toLowerCase() as keyof typeof severityCounts;
    if (sev in severityCounts) severityCounts[sev]++;
  }

  return {
    riskPosture:
      (result.risk_posture as string) ?? ctx.overallRiskPosture,
    totalRisks: risks.length,
    criticalRisks: severityCounts.critical,
    risks,
    mitigationRoadmap: (result.mitigation_roadmap as string[]) ?? [],
    narrative: (result.narrative as string) ?? "",
  };
}
