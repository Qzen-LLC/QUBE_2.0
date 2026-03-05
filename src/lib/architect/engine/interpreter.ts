import { callLLMJson } from "./llm-client";
import type { UseCaseInput, PillarScorecard } from "../models/pillars";
import type { EnrichedContext, ArchitectureComponent, DataFlow } from "../models/context";
import {
  CONTEXT_ENRICHMENT_PROMPT,
  PILLAR_SCORING_PROMPT,
} from "../prompts/enrichment";
import archetypesData from "../patterns/archetypes.json";
import pricingData from "../patterns/pricing.json";

const archetypes = archetypesData.archetypes;

// ── Stage 1: Pillar Scoring ────────────────────────────
export async function scorePillars(
  useCase: UseCaseInput
): Promise<Record<string, unknown>> {
  const prompt = PILLAR_SCORING_PROMPT.replace(
    "{use_case_json}",
    JSON.stringify(useCase, null, 2)
  );
  return callLLMJson(prompt, { maxTokens: 2048 });
}

// ── Stage 2: Archetype Matching ────────────────────────
export function matchArchetype(
  useCase: UseCaseInput
): Record<string, unknown> {
  const category = useCase.technical.useCaseCategory;
  const matches = archetypes.filter(
    (a: Record<string, unknown>) => a.category === category
  );
  return matches.length > 0
    ? matches[0]
    : archetypes[0];
}

// ── Stage 3: Context Enrichment ────────────────────────
export async function enrichContext(
  useCase: UseCaseInput,
  archetype: Record<string, unknown>,
  pillarScores: Record<string, unknown>
): Promise<EnrichedContext> {
  const prompt = CONTEXT_ENRICHMENT_PROMPT.replace(
    "{use_case_json}",
    JSON.stringify(useCase, null, 2)
  )
    .replace("{archetype_json}", JSON.stringify(archetype, null, 2))
    .replace("{pricing_json}", JSON.stringify(pricingData, null, 2));

  const enrichedRaw = await callLLMJson<Record<string, unknown>>(prompt, {
    maxTokens: 4096,
  });

  // Build scorecard from LLM scoring
  const getScore = (pillar: string) => {
    const p = pillarScores[pillar] as Record<string, unknown> | undefined;
    return (p?.score as string) ?? "amber";
  };

  const pillarScorecardData: PillarScorecard = {
    technical: getScore("technical") as PillarScorecard["technical"],
    business: getScore("business") as PillarScorecard["business"],
    responsible: getScore("responsible") as PillarScorecard["responsible"],
    legal: getScore("legal") as PillarScorecard["legal"],
    dataReadiness: getScore("data_readiness") as PillarScorecard["dataReadiness"],
    conflicts: (pillarScores.conflicts as string[]) ?? [],
    proceed: (pillarScores.proceed as boolean) ?? true,
    blockers: (pillarScores.blockers as string[]) ?? [],
  };

  // Parse components from LLM output
  const tech = (enrichedRaw.technical as Record<string, unknown>) ?? {};
  const rawComponents = (tech.components as Record<string, unknown>[]) ?? [];
  const components: ArchitectureComponent[] = rawComponents.map((c) => {
    const pricing = (c.pricing as Record<string, unknown>) ?? {};
    return {
      id: (c.id as string) ?? "unknown",
      type: (c.type as string) ?? "unknown",
      provider: (c.provider as string) ?? "unknown",
      modelOrService: (c.model_or_service as string) ?? "unknown",
      pricing: {
        inputPerMtok: (pricing.input_per_mtok as number) ?? null,
        outputPerMtok: (pricing.output_per_mtok as number) ?? null,
        perMillionVectors: (pricing.per_million_vectors as number) ?? null,
        monthlyBase: (pricing.monthly_base as number) ?? null,
        perRequest: (pricing.per_request as number) ?? null,
      },
      notes: c.notes as string | undefined,
    };
  });

  const rawFlows = (tech.data_flows as Record<string, unknown>[]) ?? [];
  const dataFlows: DataFlow[] = rawFlows.map((df) => ({
    source: (df.source as string) ?? "",
    target: (df.target as string) ?? "",
    dataType: (df.data_type as string) ?? "",
    volumeEstimate: df.volume_estimate as string | undefined,
  }));

  const biz = (enrichedRaw.business as Record<string, unknown>) ?? {};
  const resp = (enrichedRaw.responsible as Record<string, unknown>) ?? {};
  const legal = (enrichedRaw.legal as Record<string, unknown>) ?? {};
  const data = (enrichedRaw.data_readiness as Record<string, unknown>) ?? {};

  const useCaseId = `uc-${useCase.name.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`;

  const context: EnrichedContext = {
    useCaseId,
    useCaseName: useCase.name,
    archetype:
      (enrichedRaw.archetype as string) ??
      (archetype.id as string),
    confidence: (enrichedRaw.confidence as number) ?? 0.7,
    pillarScores: pillarScorecardData,
    technical: {
      category: useCase.technical.useCaseCategory,
      archetype:
        (enrichedRaw.archetype as string) ??
        (archetype.id as string),
      components,
      dataFlows,
      deploymentTarget:
        (tech.deployment_target as EnrichedContext["technical"]["deploymentTarget"]) ?? "aws",
      region: (tech.region as string) ?? "us-east-1",
      topology: (tech.topology as string) ?? "multi-az",
      latencyTargetMs: (tech.latency_target_ms as number) ?? 3000,
      orchestrationPattern:
        (tech.orchestration_pattern as string) ?? "simple_chain",
    },
    business: {
      businessOutcome:
        (biz.business_outcome as string) ?? useCase.business.businessOutcome,
      targetUsers:
        (biz.target_users as string) ?? useCase.business.targetUsers,
      isCustomerFacing:
        (biz.is_customer_facing as boolean) ??
        useCase.business.isCustomerFacing,
      dailyRequests:
        (biz.daily_requests as number) ??
        useCase.business.estimatedDailyRequests ??
        1000,
      avgInputTokens: (biz.avg_input_tokens as number) ?? 800,
      avgOutputTokens: (biz.avg_output_tokens as number) ?? 600,
      growthRateMonthly:
        (biz.growth_rate_monthly as number) ??
        useCase.business.growthRateMonthly,
      roiHypothesis:
        (biz.roi_hypothesis as string) ?? useCase.business.roiHypothesis,
      operationalReadinessScore:
        biz.operational_readiness_score as string | undefined,
    },
    responsible: {
      decisionImpactLevel:
        (resp.decision_impact_level as string) ??
        useCase.responsible.decisionImpact,
      explainabilityRequired:
        (resp.explainability_required as boolean) ??
        useCase.responsible.explainabilityRequired,
      biasRiskFactors: (resp.bias_risk_factors as string[]) ?? [],
      humanOversightModel:
        (resp.human_oversight_model as string) ??
        useCase.responsible.humanOversight,
      affectedPopulation: resp.affected_population as string | undefined,
      fairnessCriteria: resp.fairness_criteria as string | undefined,
    },
    legal: {
      regulations:
        (legal.regulations as string[]) ?? useCase.legal.regulations,
      dataClassification:
        (legal.data_classification as EnrichedContext["legal"]["dataClassification"]) ??
        useCase.legal.dataClassification,
      piiPresent:
        (legal.pii_present as boolean) ?? useCase.legal.piiPresent,
      phiPresent:
        (legal.phi_present as boolean) ?? useCase.legal.phiPresent,
      auditRequired:
        (legal.audit_required as boolean) ?? useCase.legal.auditRequired,
      crossBorderFlows:
        (legal.cross_border_flows as boolean) ??
        useCase.legal.crossBorderDataFlows,
      liabilityModel: legal.liability_model as string | undefined,
      ipConcerns: legal.ip_concerns as string | undefined,
    },
    dataReadiness: {
      dataSources:
        (data.data_sources as string[]) ?? useCase.dataReadiness.dataSources,
      qualityScore:
        (data.quality_score as string) ??
        useCase.dataReadiness.dataQualityScore ??
        "unknown",
      goldenDatasetExists:
        (data.golden_dataset_exists as boolean) ??
        useCase.dataReadiness.goldenDatasetExists,
      goldenDatasetSize: data.golden_dataset_size as number | undefined,
      labelingStatus:
        (data.labeling_status as string) ??
        useCase.dataReadiness.labelingStatus ??
        "none",
      freshness:
        (data.freshness as string) ??
        useCase.dataReadiness.dataFreshness ??
        "static",
      corpusDocumentCount:
        (data.corpus_document_count as number) ??
        useCase.dataReadiness.corpusDocumentCount,
      pipelineMaturity:
        (data.pipeline_maturity as string) ??
        useCase.dataReadiness.pipelineMaturity,
    },
    overallRiskPosture:
      (enrichedRaw.overall_risk_posture as string) ?? "medium",
    estimatedComplexity:
      (enrichedRaw.estimated_complexity as string) ?? "moderate",
    recommendedTier:
      (enrichedRaw.recommended_tier as string) ?? "tier_2",
  };

  return context;
}

// ── Full Interpretation Pipeline ──────────────────────
export async function interpret(
  useCase: UseCaseInput
): Promise<{ context: EnrichedContext; pillarScores: Record<string, unknown> }> {
  const pillarScores = await scorePillars(useCase);

  const archetype = matchArchetype(useCase);

  const context = await enrichContext(useCase, archetype, pillarScores);

  return { context, pillarScores };
}
