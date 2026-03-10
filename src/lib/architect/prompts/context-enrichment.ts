// ── Multi-call context enrichment prompts ──────────────────
// Split into 6 parallel pillar calls + 1 sequential synthesis call.
// Each prompt targets ≤2000 output tokens to avoid truncation on smaller models.

const SHARED_PREAMBLE = `Tag inferred values with "_inferred": true so the UI can highlight assumptions.
Return ONLY valid JSON — no markdown fences, no commentary.`;

// ── Phase 1: Parallel Pillar Calls ────────────────────────

export const TECHNICAL_ENRICHMENT_PROMPT = `You are an AI architecture analyst. Given the use case and archetype below, produce a JSON object with ONLY the technical infrastructure fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Pricing Catalog
{pricing_json}

## Instructions
${SHARED_PREAMBLE}

{
  "components": [
    {
      "id": "<unique_id>",
      "type": "<llm|embedding_model|vector_store|orchestrator|compute|monitoring|...>",
      "provider": "<provider>",
      "model_or_service": "<specific model or service>",
      "pricing": {
        "input_per_mtok": <float|null>,
        "output_per_mtok": <float|null>,
        "per_million_vectors": <float|null>,
        "monthly_base": <float|null>,
        "per_request": <float|null>
      },
      "notes": "<any notes>"
    }
  ],
  "data_flows": [
    { "source": "<component_id>", "target": "<component_id>", "data_type": "<type>", "volume_estimate": "<estimate>" }
  ],
  "deployment_target": "<aws|azure|gcp|on_prem|hybrid>",
  "region": "<region>",
  "topology": "<single-az|multi-az|multi-region>",
  "latency_target_ms": <int>,
  "orchestration_pattern": "<simple_chain|dag|multi_agent|human_in_loop>",
  "has_tool_use": <bool>,
  "api_surface_exposure": "<none|internal_only|partner_api|public_api>",
  "multi_vendor_count": <int>,
  "infrastructure_maturity_level": "<nascent|developing|established|advanced>",
  "network_boundary_crossings": <int>,
  "encryption_requirements": {
    "at_rest": <bool>,
    "in_transit": <bool>,
    "key_management": "<provider_managed|customer_managed|hsm>"
  },
  "failover_strategy": "<none|active_passive|active_active|multi_region>",
  "deployment_strategy": "<direct|rolling|blue_green|canary>"
}

## Inference Guidance
- **has_tool_use**: true if archetype involves tool calling, function execution, API invocations, or code execution. Always true for agentic_workflow and internal_copilot.
- **api_surface_exposure**: "public_api" if customer-facing with external access, "internal_only" for internal tools, "partner_api" for B2B.
- **multi_vendor_count**: Count distinct cloud/AI providers in the component list.
- **infrastructure_maturity_level**: Infer from pipeline_maturity, deployment_target, topology. "nascent" = no CI/CD, "advanced" = automated multi-region.
- **network_boundary_crossings**: Count distinct network boundaries data must cross.
- **encryption_requirements**: at_rest MUST be true if data_classification is confidential/restricted or pii/phi present. in_transit should almost always be true.
- **failover_strategy**: "none" for dev/test, "active_passive" for standard prod, "active_active" for high-availability customer-facing.
- **deployment_strategy**: "canary"/"blue_green" for customer-facing prod, "rolling" for internal, "direct" for dev/test.

## Archetype Priorities
- **agentic_workflow / internal_copilot**: has_tool_use MUST be true, failover_strategy critical
- **enterprise_rag**: encryption_requirements critical, sensitive data handling
- **document_processor**: encryption at_rest MUST be true for sensitive docs
- **code_assistant**: api_surface_exposure, secrets handling critical`;

export const BUSINESS_ENRICHMENT_PROMPT = `You are an AI business analyst. Given the use case and archetype below, produce a JSON object with ONLY the business viability fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Pricing Catalog
{pricing_json}

## Instructions
${SHARED_PREAMBLE}

{
  "business_outcome": "<outcome>",
  "target_users": "<users>",
  "is_customer_facing": <bool>,
  "daily_requests": <int>,
  "avg_input_tokens": <int>,
  "avg_output_tokens": <int>,
  "growth_rate_monthly": <float>,
  "roi_hypothesis": "<hypothesis>",
  "operational_readiness_score": "<high|medium|low>",
  "cost_sensitivity_level": "<low|medium|high|critical>",
  "budget_ceiling_usd_monthly": <number|null>,
  "scaling_profile": "<flat|linear|exponential>",
  "pilot_recommended": <bool>,
  "strategic_importance": "<low|medium|high|critical>",
  "cost_per_request_estimated_usd": <float>,
  "cost_explosion_risk_multiplier": <float>,
  "model_alternative_cost_delta": [
    { "model": "<alternative model>", "savings_percent": <float> }
  ]
}

## Inference Guidance
- **cost_sensitivity_level**: "critical" if budget ceiling is tight, "high" for cost-conscious, "low" for R&D/innovation.
- **budget_ceiling_usd_monthly**: Infer from business context if mentioned, otherwise null.
- **scaling_profile**: "exponential" for viral/consumer, "linear" for steady enterprise, "flat" for internal tools with fixed users.
- **pilot_recommended**: true if complexity is "complex" or risk is "high"/"critical", or first AI deployment.
- **strategic_importance**: "critical" if autonomous decisions, customer-facing + high volume, or revenue-generating.
- **cost_per_request_estimated_usd**: Calculate from avg tokens and model pricing.
- **cost_explosion_risk_multiplier**: Default 10. For agentic with uncontrolled tool loops: 50-100x. Simple RAG: 5-10x.
- **model_alternative_cost_delta**: Suggest 1-2 cheaper model alternatives with estimated savings.

## Archetype Priorities
- **agentic_workflow**: cost_explosion_risk_multiplier critical (10x+ for uncontrolled tool loops)
- **content_generator**: cost_per_request_estimated_usd important
- **code_assistant**: cost_sensitivity_level, model_alternative_cost_delta important`;

export const RESPONSIBLE_ENRICHMENT_PROMPT = `You are an AI ethics and responsible AI analyst. Given the use case and archetype below, produce a JSON object with ONLY the responsible AI fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Instructions
${SHARED_PREAMBLE}

{
  "decision_impact_level": "<informational|advisory|decision_support|autonomous>",
  "explainability_required": <bool>,
  "bias_risk_factors": ["<factor1>", "<factor2>"],
  "human_oversight_model": "<none|escalation_only|review_before_action|always_in_loop>",
  "affected_population": "<description>",
  "fairness_criteria": "<criteria>",
  "guardrail_layers_required": ["<input>", "<retrieval>", "<generation>", ...],
  "eval_platform_hint": "<langfuse|langsmith|custom|none>",
  "human_review_required": <bool>,
  "protected_attributes": ["<attribute1>", "<attribute2>"],
  "fairness_metric_categories": ["<category1>", "<category2>"],
  "bias_testing": {
    "required": <bool>,
    "methodology": "<methodology>",
    "frequency": "<per_release|weekly|monthly|quarterly>"
  },
  "transparency_obligations": ["<obligation1>", "<obligation2>"],
  "conditional_approval_conditions": ["<condition1>", "<condition2>"],
  "stage_gate_requirements": [
    { "gate": "<gate name>", "owner": "<role>", "criteria": "<criteria>" }
  ],
  "remediation_roadmap": [
    { "priority": "<critical|high|medium|low>", "action": "<action>", "owner": "<role>" }
  ]
}

## Inference Guidance
- **guardrail_layers_required**: Always include "input" and "generation". Add "retrieval" for RAG. Add "agent_tool", "agent_reasoning", "agent_autonomy", "agent_cascade" for agentic. Add "observability" for production.
- **eval_platform_hint**: "langfuse"/"langsmith" if monitoring components present, "custom" for enterprise, "none" for simple.
- **human_review_required**: true if decision_impact is "decision_support"/"autonomous", or EU AI Act high_risk.
- **protected_attributes**: List attributes needing fairness protection (e.g., "race", "gender", "age", "disability").
- **fairness_metric_categories**: Relevant metrics (e.g., "demographic_parity", "equalized_odds", "individual_fairness").
- **bias_testing**: required = true if protected_attributes exist or is_customer_facing with decision impact.
- **transparency_obligations**: Specific transparency requirements (e.g., "AI disclosure to end users").
- **conditional_approval_conditions**: Conditions before full production deployment.
- **stage_gate_requirements**: Key lifecycle gates with owners and criteria.
- **remediation_roadmap**: Prioritized actions to address identified gaps.

## Archetype Priorities
- **agentic_workflow / internal_copilot**: guardrail_layers (include agent_tool, agent_reasoning, agent_autonomy, agent_cascade), human_review_required, stage_gate_requirements
- **content_generator**: bias_testing, protected_attributes, transparency_obligations, human_review_required
- **document_processor**: bias_testing (if classification decisions), human_review_required`;

export const LEGAL_ENRICHMENT_PROMPT = `You are an AI compliance and legal analyst. Given the use case and archetype below, produce a JSON object with ONLY the legal and compliance fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Instructions
${SHARED_PREAMBLE}

{
  "regulations": ["<reg1>", "<reg2>"],
  "data_classification": "<public|internal|confidential|restricted>",
  "pii_present": <bool>,
  "phi_present": <bool>,
  "audit_required": <bool>,
  "cross_border_flows": <bool>,
  "liability_model": "<model>",
  "ip_concerns": "<concerns>",
  "regulatory_burden_score": <1-10>,
  "sensitive_data_flow_exists": <bool>,
  "eu_ai_act_risk_category": "<minimal|limited|high_risk|prohibited>",
  "audit_enforcement_level": "<none|periodic|continuous|critical>",
  "compliance_cost_estimate_usd": {
    "setup": <number>,
    "annual": <number>
  },
  "vendor_supply_chain_risk_level": "<low|medium|high|critical>",
  "data_residency_requirements": ["<jurisdiction1>", "<jurisdiction2>"],
  "authentication_model": "<api_key|oauth2|saml|mfa|zero_trust>",
  "secrets_management_required": <bool>,
  "zero_trust_required": <bool>
}

## Inference Guidance
- **regulatory_burden_score**: 1-10. 1 = no regulations, 5 = standard compliance, 8+ = heavy oversight (healthcare, finance, EU AI Act high-risk).
- **sensitive_data_flow_exists**: true if PII, PHI, or confidential data moves between components.
- **eu_ai_act_risk_category**: "prohibited" for social scoring/manipulation, "high_risk" for employment/credit/law enforcement/education, "limited" for chatbots/customer service, "minimal" for internal tools.
- **audit_enforcement_level**: "critical" for financial/healthcare, "continuous" for high-risk EU AI Act, "periodic" for standard, "none" for no audit.
- **compliance_cost_estimate_usd**: Estimate setup (one-time) and annual costs.
- **vendor_supply_chain_risk_level**: "critical" if single vendor for core capability with no fallback, "high" if using preview/beta APIs.
- **data_residency_requirements**: List jurisdictions where data must stay (e.g., "EU", "US", "UAE").
- **authentication_model**: "zero_trust" for high-security, "oauth2" for standard SaaS, "api_key" for internal.
- **secrets_management_required**: true if API keys, credentials, or tokens are used. Almost always true.
- **zero_trust_required**: true for high-risk, government, or financial services.

## Archetype Priorities
- **enterprise_rag**: sensitive_data_flow_exists, data_residency_requirements, compliance_cost_estimate_usd, eu_ai_act_risk_category critical
- **document_processor**: sensitive_data_flow_exists CRITICAL (document content often contains PII/PHI), data_residency_requirements
- **code_assistant**: secrets_management_required MUST be true, authentication_model, zero_trust_required, ip_concerns`;

export const DATA_READINESS_ENRICHMENT_PROMPT = `You are an AI data readiness analyst. Given the use case and archetype below, produce a JSON object with ONLY the data readiness and operational fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Instructions
${SHARED_PREAMBLE}

{
  "data_sources": ["<source1>", "<source2>"],
  "quality_score": "<high|medium|low|unknown>",
  "golden_dataset_exists": <bool>,
  "golden_dataset_size": <int|null>,
  "labeling_status": "<none|partial|complete>",
  "freshness": "<real-time|daily|weekly|static>",
  "corpus_document_count": <int|null>,
  "pipeline_maturity": "<none|ad_hoc|managed|automated|optimized>",
  "data_preparation_critical": <bool>,
  "data_freshness_guardrail_interval_days": <int>,
  "data_staleness_risk": "<none|low|medium|high>",
  "observability_required": <bool>,
  "observability_cost_estimate_usd_monthly": <number>,
  "sla_requirements": {
    "uptime": "<99.9%|99.95%|99.99%>",
    "latency_p99_ms": <int>,
    "throughput_rps": <int>
  },
  "incident_escalation_matrix": [
    { "severity": "<p1|p2|p3|p4>", "escalate_to": "<role>", "within_hours": <number> }
  ],
  "periodic_review_cadence": "<weekly|monthly|quarterly|annually>"
}

## Inference Guidance
- **data_preparation_critical**: true if quality_score is "low"/"unknown" or golden_dataset_exists is false.
- **data_freshness_guardrail_interval_days**: Max days before data is stale. 1 for real-time, 7 for daily, 30 for weekly, 90 for static.
- **data_staleness_risk**: "high" if freshness matters and pipeline is immature, "none" for static data.
- **observability_required**: true for any production deployment, especially customer-facing.
- **observability_cost_estimate_usd_monthly**: Estimate based on daily_requests and retention. Typically $50-500/month.
- **sla_requirements**: Infer from customer_facing status and strategic_importance.
- **incident_escalation_matrix**: Define escalation paths for P1-P4 incidents.
- **periodic_review_cadence**: "monthly" for high-risk, "quarterly" for standard, "annually" for low-risk.

## Archetype Priorities
- **enterprise_rag**: data_freshness_guardrail_interval_days, data_staleness_risk, observability_required critical
- **document_processor**: sla_requirements important
- **agentic_workflow**: incident_escalation_matrix critical`;

export const ROOT_META_ENRICHMENT_PROMPT = `You are an AI architecture analyst. Given the use case and archetype below, produce a JSON object with ONLY these 5 root-level classification fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Instructions
${SHARED_PREAMBLE}

{
  "archetype": "<matched archetype id>",
  "confidence": <0.0-1.0>,
  "overall_risk_posture": "<low|medium|high|critical>",
  "estimated_complexity": "<simple|moderate|complex>",
  "recommended_tier": "<tier_1|tier_2|tier_3>"
}`;

// ── Phase 2: Synthesis (runs after Phase 1) ───────────────

export const SYNTHESIS_ENRICHMENT_PROMPT = `You are an AI governance synthesis analyst. Given the pillar summaries from a multi-pillar analysis, produce a JSON object with cross-cutting synthesis fields.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Pillar Summaries from Phase 1
{pillar_summaries_json}

## Instructions
${SHARED_PREAMBLE}

Analyze the pillar summaries to identify cross-pillar conflicts, readiness blockers, and overall go/no-go recommendation.

{
  "readiness_blockers": ["<blocker1>", "<blocker2>"],
  "cross_pillar_conflicts": ["<conflict1>", "<conflict2>"],
  "confidence_factors": { "<pillar>": "<high|medium|low>" },
  "assumption_log": [
    { "field": "<field_name>", "assumed": "<assumed value>", "risk": "<risk if wrong>" }
  ],
  "follow_up_questions_required": [
    { "pillar": "<pillar>", "question": "<question>", "impact": "<high|medium|low>" }
  ],
  "go_no_go_recommendation": "<go|conditional_go|no_go>"
}

## Inference Guidance
- **readiness_blockers**: List specific items that MUST be resolved before production (e.g., "No golden dataset", "Missing encryption at rest").
- **cross_pillar_conflicts**: Identify conflicts between pillars (e.g., "Low latency target conflicts with multi-region requirement").
- **confidence_factors**: Per-pillar confidence in the inference quality.
- **assumption_log**: For each significant inference, log what was assumed and the risk if wrong.
- **follow_up_questions_required**: Questions that would significantly improve inference quality if answered.
- **go_no_go_recommendation**: "go" if all pillars are green/amber with no blockers, "conditional_go" if conditions to meet, "no_go" if critical blockers.`;
