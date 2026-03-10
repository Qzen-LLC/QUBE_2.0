import { callLLMJson } from "./llm-client";
import type { UseCaseInput, PillarScorecard } from "../models/pillars";
import type {
  EnrichedContext,
  ArchitectureComponent,
  DataFlow,
  EncryptionRequirements,
  ComplianceCostEstimate,
  BiasTesting,
  SlaRequirements,
  StageGate,
  RemediationItem,
  IncidentEscalation,
  AssumptionLogEntry,
  FollowUpQuestion,
  ModelAlternative,
} from "../models/context";
import {
  TECHNICAL_ENRICHMENT_PROMPT,
  BUSINESS_ENRICHMENT_PROMPT,
  RESPONSIBLE_ENRICHMENT_PROMPT,
  LEGAL_ENRICHMENT_PROMPT,
  DATA_READINESS_ENRICHMENT_PROMPT,
  ROOT_META_ENRICHMENT_PROMPT,
  SYNTHESIS_ENRICHMENT_PROMPT,
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

// ── Helpers for sub-object parsing ─────────────────────
function parseSubObj<T>(raw: unknown, mapper: (r: Record<string, unknown>) => T): T | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return mapper(raw as Record<string, unknown>);
}

function parseSubArray<T>(raw: unknown, mapper: (r: Record<string, unknown>) => T): T[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((item) => mapper(item as Record<string, unknown>));
}

// ── Safe pillar call wrapper ───────────────────────────
async function safePillarCall(
  prompt: string,
  maxTokens: number,
  label: string
): Promise<Record<string, unknown>> {
  try {
    const result = await callLLMJson<Record<string, unknown>>(prompt, { maxTokens });
    console.log(`[enrichContext] ${label} call succeeded`);
    return result;
  } catch (err) {
    console.warn(`[enrichContext] ${label} call failed, using empty fallback:`, err);
    return {};
  }
}

// ── Build pillar summary for synthesis ─────────────────
function buildPillarSummary(
  tech: Record<string, unknown>,
  biz: Record<string, unknown>,
  resp: Record<string, unknown>,
  legal: Record<string, unknown>,
  data: Record<string, unknown>,
  rootMeta: Record<string, unknown>
): Record<string, unknown> {
  return {
    technical: {
      deployment_target: tech.deployment_target,
      topology: tech.topology,
      has_tool_use: tech.has_tool_use,
      orchestration_pattern: tech.orchestration_pattern,
      api_surface_exposure: tech.api_surface_exposure,
      failover_strategy: tech.failover_strategy,
      encryption_requirements: tech.encryption_requirements,
    },
    business: {
      is_customer_facing: biz.is_customer_facing,
      daily_requests: biz.daily_requests,
      strategic_importance: biz.strategic_importance,
      cost_sensitivity_level: biz.cost_sensitivity_level,
      pilot_recommended: biz.pilot_recommended,
      cost_explosion_risk_multiplier: biz.cost_explosion_risk_multiplier,
    },
    responsible: {
      decision_impact_level: resp.decision_impact_level,
      human_oversight_model: resp.human_oversight_model,
      human_review_required: resp.human_review_required,
      guardrail_layers_required: resp.guardrail_layers_required,
    },
    legal: {
      data_classification: legal.data_classification,
      pii_present: legal.pii_present,
      eu_ai_act_risk_category: legal.eu_ai_act_risk_category,
      regulatory_burden_score: legal.regulatory_burden_score,
      sensitive_data_flow_exists: legal.sensitive_data_flow_exists,
    },
    data_readiness: {
      quality_score: data.quality_score,
      pipeline_maturity: data.pipeline_maturity,
      data_staleness_risk: data.data_staleness_risk,
      observability_required: data.observability_required,
      golden_dataset_exists: data.golden_dataset_exists,
    },
    root_meta: rootMeta,
  };
}

// ── Stage 3: Context Enrichment (multi-call pipeline) ──
export async function enrichContext(
  useCase: UseCaseInput,
  archetype: Record<string, unknown>,
  pillarScores: Record<string, unknown>
): Promise<EnrichedContext> {
  const useCaseJson = JSON.stringify(useCase, null, 2);
  const archetypeJson = JSON.stringify(archetype, null, 2);
  const pricingJson = JSON.stringify(pricingData, null, 2);

  // Helper to fill placeholders in a prompt template
  const fillPrompt = (template: string, extras?: Record<string, string>): string => {
    let result = template
      .replace("{use_case_json}", useCaseJson)
      .replace("{archetype_json}", archetypeJson);
    if (template.includes("{pricing_json}")) {
      result = result.replace("{pricing_json}", pricingJson);
    }
    if (extras) {
      for (const [key, value] of Object.entries(extras)) {
        result = result.replace(`{${key}}`, value);
      }
    }
    return result;
  };

  // Phase 1: 6 parallel calls
  console.log("[enrichContext] Starting Phase 1: 6 parallel pillar calls");
  const [tech, biz, resp, legal, data, rootMeta] = await Promise.all([
    safePillarCall(fillPrompt(TECHNICAL_ENRICHMENT_PROMPT), 2000, "technical"),
    safePillarCall(fillPrompt(BUSINESS_ENRICHMENT_PROMPT), 2000, "business"),
    safePillarCall(fillPrompt(RESPONSIBLE_ENRICHMENT_PROMPT), 2000, "responsible"),
    safePillarCall(fillPrompt(LEGAL_ENRICHMENT_PROMPT), 2000, "legal"),
    safePillarCall(fillPrompt(DATA_READINESS_ENRICHMENT_PROMPT), 2000, "data_readiness"),
    safePillarCall(fillPrompt(ROOT_META_ENRICHMENT_PROMPT), 512, "root_meta"),
  ]);

  // Phase 2: synthesis with pillar summaries
  console.log("[enrichContext] Starting Phase 2: synthesis call");
  const pillarSummary = buildPillarSummary(tech, biz, resp, legal, data, rootMeta);
  const synthesis = await safePillarCall(
    fillPrompt(SYNTHESIS_ENRICHMENT_PROMPT, {
      pillar_summaries_json: JSON.stringify(pillarSummary, null, 2),
    }),
    2000,
    "synthesis"
  );

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

  // Parse components from technical call
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

  const useCaseId = `uc-${useCase.name.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`;

  // Parse sub-objects for new fields
  const encryptionRequirements = parseSubObj<EncryptionRequirements>(
    tech.encryption_requirements,
    (r) => ({
      atRest: r.at_rest as boolean | undefined,
      inTransit: r.in_transit as boolean | undefined,
      keyManagement: r.key_management as string | undefined,
    })
  );

  const complianceCostEstimateUsd = parseSubObj<ComplianceCostEstimate>(
    legal.compliance_cost_estimate_usd,
    (r) => ({
      setup: r.setup as number | undefined,
      annual: r.annual as number | undefined,
    })
  );

  const biasTesting = parseSubObj<BiasTesting>(
    resp.bias_testing,
    (r) => ({
      required: r.required as boolean | undefined,
      methodology: r.methodology as string | undefined,
      frequency: r.frequency as string | undefined,
    })
  );

  const slaRequirements = parseSubObj<SlaRequirements>(
    data.sla_requirements,
    (r) => ({
      uptime: r.uptime as string | undefined,
      latencyP99Ms: r.latency_p99_ms as number | undefined,
      throughputRps: r.throughput_rps as number | undefined,
    })
  );

  const stageGateRequirements = parseSubArray<StageGate>(
    resp.stage_gate_requirements,
    (r) => ({
      gate: r.gate as string | undefined,
      owner: r.owner as string | undefined,
      criteria: r.criteria as string | undefined,
    })
  );

  const remediationRoadmap = parseSubArray<RemediationItem>(
    resp.remediation_roadmap,
    (r) => ({
      priority: r.priority as string | undefined,
      action: r.action as string | undefined,
      owner: r.owner as string | undefined,
    })
  );

  const incidentEscalationMatrix = parseSubArray<IncidentEscalation>(
    data.incident_escalation_matrix,
    (r) => ({
      severity: r.severity as string | undefined,
      escalateTo: r.escalate_to as string | undefined,
      withinHours: r.within_hours as number | undefined,
    })
  );

  const assumptionLog = parseSubArray<AssumptionLogEntry>(
    synthesis.assumption_log,
    (r) => ({
      field: r.field as string | undefined,
      assumed: r.assumed as string | undefined,
      risk: r.risk as string | undefined,
    })
  );

  const followUpQuestionsRequired = parseSubArray<FollowUpQuestion>(
    synthesis.follow_up_questions_required,
    (r) => ({
      pillar: r.pillar as string | undefined,
      question: r.question as string | undefined,
      impact: r.impact as string | undefined,
    })
  );

  const modelAlternativeCostDelta = parseSubArray<ModelAlternative>(
    biz.model_alternative_cost_delta,
    (r) => ({
      model: r.model as string | undefined,
      savingsPercent: r.savings_percent as number | undefined,
    })
  );

  const context: EnrichedContext = {
    useCaseId,
    useCaseName: useCase.name,
    archetype:
      (rootMeta.archetype as string) ??
      (archetype.id as string),
    confidence: (rootMeta.confidence as number) ?? 0.7,
    pillarScores: pillarScorecardData,
    technical: {
      category: useCase.technical.useCaseCategory,
      archetype:
        (rootMeta.archetype as string) ??
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
      hasToolUse: tech.has_tool_use as boolean | undefined,
      apiSurfaceExposure: tech.api_surface_exposure as string | undefined,
      multiVendorCount: tech.multi_vendor_count as number | undefined,
      infrastructureMaturityLevel: tech.infrastructure_maturity_level as string | undefined,
      networkBoundaryCrossings: tech.network_boundary_crossings as number | undefined,
      encryptionRequirements,
      failoverStrategy: tech.failover_strategy as string | undefined,
      deploymentStrategy: tech.deployment_strategy as string | undefined,
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
      costSensitivityLevel: biz.cost_sensitivity_level as string | undefined,
      budgetCeilingUsdMonthly: biz.budget_ceiling_usd_monthly as number | undefined,
      scalingProfile: biz.scaling_profile as string | undefined,
      pilotRecommended: biz.pilot_recommended as boolean | undefined,
      strategicImportance: biz.strategic_importance as string | undefined,
      costPerRequestEstimatedUsd: biz.cost_per_request_estimated_usd as number | undefined,
      costExplosionRiskMultiplier: biz.cost_explosion_risk_multiplier as number | undefined,
      modelAlternativeCostDelta,
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
      guardrailLayersRequired: resp.guardrail_layers_required as string[] | undefined,
      evalPlatformHint: resp.eval_platform_hint as string | undefined,
      humanReviewRequired: resp.human_review_required as boolean | undefined,
      protectedAttributes: resp.protected_attributes as string[] | undefined,
      fairnessMetricCategories: resp.fairness_metric_categories as string[] | undefined,
      biasTesting,
      transparencyObligations: resp.transparency_obligations as string[] | undefined,
      conditionalApprovalConditions: resp.conditional_approval_conditions as string[] | undefined,
      stageGateRequirements,
      remediationRoadmap,
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
      regulatoryBurdenScore: legal.regulatory_burden_score as number | undefined,
      sensitiveDataFlowExists: legal.sensitive_data_flow_exists as boolean | undefined,
      euAiActRiskCategory: legal.eu_ai_act_risk_category as string | undefined,
      auditEnforcementLevel: legal.audit_enforcement_level as string | undefined,
      complianceCostEstimateUsd,
      vendorSupplyChainRiskLevel: legal.vendor_supply_chain_risk_level as string | undefined,
      dataResidencyRequirements: legal.data_residency_requirements as string[] | undefined,
      authenticationModel: legal.authentication_model as string | undefined,
      secretsManagementRequired: legal.secrets_management_required as boolean | undefined,
      zeroTrustRequired: legal.zero_trust_required as boolean | undefined,
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
      dataPreparationCritical: data.data_preparation_critical as boolean | undefined,
      dataFreshnessGuardrailIntervalDays: data.data_freshness_guardrail_interval_days as number | undefined,
      dataStalenessRisk: data.data_staleness_risk as string | undefined,
      observabilityRequired: data.observability_required as boolean | undefined,
      observabilityCostEstimateUsdMonthly: data.observability_cost_estimate_usd_monthly as number | undefined,
      slaRequirements,
      incidentEscalationMatrix,
      periodicReviewCadence: data.periodic_review_cadence as string | undefined,
    },
    overallRiskPosture:
      (rootMeta.overall_risk_posture as string) ?? "medium",
    estimatedComplexity:
      (rootMeta.estimated_complexity as string) ?? "moderate",
    recommendedTier:
      (rootMeta.recommended_tier as string) ?? "tier_2",
    readinessBlockers: synthesis.readiness_blockers as string[] | undefined,
    crossPillarConflicts: synthesis.cross_pillar_conflicts as string[] | undefined,
    confidenceFactors: synthesis.confidence_factors as Record<string, string> | undefined,
    assumptionLog,
    followUpQuestionsRequired,
    goNoGoRecommendation: synthesis.go_no_go_recommendation as string | undefined,
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
