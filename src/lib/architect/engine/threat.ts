import { callLLMJson } from "./llm-client";
import type { EnrichedContext } from "../models/context";
import type { ThreatOutput, ThreatItem } from "../models/outputs";
import { THREAT_GENERATION_PROMPT } from "../prompts/generation";

export async function generateThreats(
  ctx: EnrichedContext
): Promise<ThreatOutput> {
  const componentsSummary = ctx.technical.components.map((c) => ({
    id: c.id,
    type: c.type,
    provider: c.provider,
    model: c.modelOrService,
  }));

  const prompt = THREAT_GENERATION_PROMPT.replace(
    "{context_json}",
    JSON.stringify(ctx, null, 2)
  ).replace("{components_json}", JSON.stringify(componentsSummary, null, 2));

  const result = await callLLMJson<Record<string, unknown>>(prompt, {
    maxTokens: 4096,
    system: undefined,
  });

  const rawThreats = (result.threats as Record<string, unknown>[]) ?? [];
  const threats: ThreatItem[] = rawThreats.map((t) => ({
    id: (t.id as string) ?? "THREAT-000",
    strideCategory: (t.stride_category as string) ?? "info_disclosure",
    threatName: (t.threat_name as string) ?? "Unknown Threat",
    description: (t.description as string) ?? "",
    attackVector: (t.attack_vector as string) ?? "",
    severity: (t.severity as string) ?? "medium",
    affectedComponents: (t.affected_components as string[]) ?? [],
    sourcePillar: (t.source_pillar as string) ?? "technical",
    recommendedControls: (t.recommended_controls as string[]) ?? [],
  }));

  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const threat of threats) {
    const sev = threat.severity.toLowerCase() as keyof typeof severityCounts;
    if (sev in severityCounts) severityCounts[sev]++;
  }

  return {
    threatPosture: (result.threat_posture as string) ?? "medium",
    totalThreats: threats.length,
    criticalThreats: severityCounts.critical,
    threats,
    attackSurfaceSummary: (result.attack_surface_summary as string) ?? "",
    narrative: (result.narrative as string) ?? "",
  };
}
