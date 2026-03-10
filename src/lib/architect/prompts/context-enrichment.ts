export const CONTEXT_ENRICHMENT_PROMPT = `Given the following use case input across 5 pillars, enrich it into
a complete architectural context. Infer unstated requirements, resolve component selections,
and estimate data flow volumes.

## Use Case Input
{use_case_json}

## Matched Archetype
{archetype_json}

## Pricing Catalog
{pricing_json}

## Instructions
Produce a JSON object with the following structure. For each field, use the user's explicit
input when provided. When not provided, infer from the archetype and domain context.

Tag inferred values with "_inferred": true so the UI can highlight assumptions.

{
  "archetype": "<matched archetype id>",
  "confidence": <0.0-1.0>,
  "technical": {
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
  },
  "business": {
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
  },
  "responsible": {
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
  },
  "legal": {
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
  },
  "data_readiness": {
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
  },
  "overall_risk_posture": "<low|medium|high|critical>",
  "estimated_complexity": "<simple|moderate|complex>",
  "recommended_tier": "<tier_1|tier_2|tier_3>",
  "readiness_blockers": ["<blocker1>", "<blocker2>"],
  "cross_pillar_conflicts": ["<conflict1>", "<conflict2>"],
  "confidence_factors": { "<pillar>": "<high|medium|low>", ... },
  "assumption_log": [
    { "field": "<field_name>", "assumed": "<assumed value>", "risk": "<risk if wrong>" }
  ],
  "follow_up_questions_required": [
    { "pillar": "<pillar>", "question": "<question>", "impact": "<high|medium|low>" }
  ],
  "go_no_go_recommendation": "<go|conditional_go|no_go>"
}

## New Field Inference Guidance

- **has_tool_use**: true if the archetype involves tool calling, function execution, API invocations, or code execution. Always true for agentic_workflow and internal_copilot archetypes.
- **api_surface_exposure**: "public_api" if customer-facing with external access, "internal_only" for internal tools, "partner_api" for B2B integrations.
- **multi_vendor_count**: Count distinct cloud/AI providers in the component list.
- **infrastructure_maturity_level**: Infer from pipeline_maturity, deployment_target, and topology. "nascent" = no CI/CD, "advanced" = automated with multi-region.
- **network_boundary_crossings**: Count distinct network boundaries data must cross (e.g., VPC to internet, region to region).
- **encryption_requirements**: at_rest MUST be true if data_classification is confidential/restricted or pii_present/phi_present. in_transit should almost always be true.
- **failover_strategy**: "none" for simple dev/test, "active_passive" for standard production, "active_active" for high-availability customer-facing.
- **deployment_strategy**: "canary" or "blue_green" for customer-facing production, "rolling" for internal, "direct" for dev/test only.
- **cost_sensitivity_level**: "critical" if budget_ceiling is set and tight, "high" for cost-conscious orgs, "low" for R&D/innovation.
- **budget_ceiling_usd_monthly**: Infer from business context if mentioned, otherwise null.
- **scaling_profile**: "exponential" for viral/consumer products, "linear" for steady enterprise growth, "flat" for internal tools with fixed user base.
- **pilot_recommended**: true if estimated_complexity is "complex" or overall_risk_posture is "high"/"critical", or if this is the org's first AI deployment.
- **strategic_importance**: "critical" if autonomous decisions, customer-facing + high volume, or revenue-generating. "low" for internal efficiency tools.
- **cost_per_request_estimated_usd**: Calculate from avg tokens and model pricing.
- **cost_explosion_risk_multiplier**: Default 10. For agentic with uncontrolled tool loops: 50-100x. For simple RAG: 5-10x.
- **model_alternative_cost_delta**: Suggest 1-2 cheaper model alternatives with estimated savings percentage.
- **regulatory_burden_score**: 1-10 scale. 1 = no regulations, 5 = standard compliance, 8+ = heavy regulatory oversight (healthcare, finance, EU AI Act high-risk).
- **sensitive_data_flow_exists**: true if PII, PHI, or confidential data moves between components.
- **eu_ai_act_risk_category**: "prohibited" for social scoring/manipulation, "high_risk" for employment/credit/law enforcement/education decisions, "limited" for chatbots/customer service, "minimal" for internal tools.
- **audit_enforcement_level**: "critical" for financial/healthcare, "continuous" for high-risk EU AI Act, "periodic" for standard compliance, "none" for no audit.
- **compliance_cost_estimate_usd**: Estimate setup (one-time) and annual costs for achieving/maintaining compliance.
- **vendor_supply_chain_risk_level**: "critical" if single vendor for core capability with no fallback, "high" if using preview/beta APIs.
- **data_residency_requirements**: List jurisdictions where data must stay (e.g., "EU", "US", "UAE").
- **authentication_model**: Infer from deployment context. "zero_trust" for high-security, "oauth2" for standard SaaS, "api_key" for internal.
- **secrets_management_required**: true if API keys, credentials, or tokens are used. Almost always true.
- **zero_trust_required**: true for high-risk deployments, government, or financial services.
- **guardrail_layers_required**: List layers needed. Always include "input" and "generation". Add "retrieval" for RAG. Add "agent_tool", "agent_reasoning", "agent_autonomy", "agent_cascade" for agentic systems. Add "observability" for production systems.
- **eval_platform_hint**: "langfuse" or "langsmith" if monitoring components are present, "custom" for enterprise, "none" for simple deployments.
- **human_review_required**: true if decision_impact_level is "decision_support" or "autonomous", or if EU AI Act high_risk.
- **protected_attributes**: List attributes that need fairness protection (e.g., "race", "gender", "age", "disability").
- **fairness_metric_categories**: Relevant fairness metrics (e.g., "demographic_parity", "equalized_odds", "individual_fairness").
- **bias_testing**: required = true if protected_attributes exist or is_customer_facing with decision impact.
- **transparency_obligations**: List specific transparency requirements (e.g., "AI disclosure to end users", "explanation of decisions").
- **conditional_approval_conditions**: Conditions that must be met before full production deployment.
- **stage_gate_requirements**: Key gates in the deployment lifecycle with owners and criteria.
- **remediation_roadmap**: Prioritized actions to address identified gaps.
- **data_preparation_critical**: true if quality_score is "low"/"unknown" or golden_dataset_exists is false.
- **data_freshness_guardrail_interval_days**: Max days before data is considered stale. 1 for real-time, 7 for daily, 30 for weekly, 90 for static.
- **data_staleness_risk**: "high" if freshness matters and pipeline is immature, "none" for static data.
- **observability_required**: true for any production deployment, especially customer-facing.
- **observability_cost_estimate_usd_monthly**: Estimate based on daily_requests and retention needs. Typically $50-500/month.
- **sla_requirements**: Infer from customer_facing status and strategic_importance.
- **incident_escalation_matrix**: Define escalation paths for P1-P4 incidents.
- **periodic_review_cadence**: "monthly" for high-risk, "quarterly" for standard, "annually" for low-risk.
- **readiness_blockers**: List specific items that MUST be resolved before production (e.g., "No golden dataset", "Missing encryption at rest").
- **cross_pillar_conflicts**: Identify conflicts between pillars (e.g., "Low latency target conflicts with multi-region requirement").
- **confidence_factors**: Per-pillar confidence in the inference quality.
- **assumption_log**: For each significant inference, log what was assumed and the risk if wrong.
- **follow_up_questions_required**: Questions that would significantly improve inference quality if answered.
- **go_no_go_recommendation**: "go" if all pillars are green/amber with no blockers, "conditional_go" if there are conditions to meet, "no_go" if there are critical blockers or red pillar scores.

## Archetype-Specific Field Priorities

For **agentic_workflow** / **internal_copilot**: Prioritize high-quality inference for:
- has_tool_use (MUST be true), guardrail_layers_required (include agent_tool, agent_reasoning, agent_autonomy, agent_cascade),
  cost_explosion_risk_multiplier (10x+ for uncontrolled tool loops), failover_strategy, human_review_required,
  stage_gate_requirements (gate autonomous actions), incident_escalation_matrix

For **enterprise_rag**: Prioritize:
- data_freshness_guardrail_interval_days, data_staleness_risk, encryption_requirements,
  sensitive_data_flow_exists, data_residency_requirements, observability_required,
  compliance_cost_estimate_usd (data handling costs), eu_ai_act_risk_category

For **document_processor**: Prioritize:
- sensitive_data_flow_exists (CRITICAL — document content often contains PII/PHI),
  encryption_requirements (at_rest MUST be true for sensitive docs), data_residency_requirements,
  bias_testing (if classification decisions), human_review_required, sla_requirements

For **code_assistant**: Prioritize:
- api_surface_exposure, secrets_management_required (MUST be true), authentication_model,
  zero_trust_required, has_tool_use (true if code execution), ip_concerns,
  cost_sensitivity_level, model_alternative_cost_delta

For **content_generator**: Prioritize:
- bias_testing (brand voice, stereotypes), protected_attributes, transparency_obligations,
  human_review_required, pilot_recommended, cost_per_request_estimated_usd,
  guardrail_layers_required (output quality layers)

Fields not prioritized for an archetype should still be inferred when signal exists — priorities just mean "invest more reasoning effort here".`;
