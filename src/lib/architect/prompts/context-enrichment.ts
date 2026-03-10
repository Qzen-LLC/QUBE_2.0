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
    "orchestration_pattern": "<simple_chain|dag|multi_agent|human_in_loop>"
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
    "operational_readiness_score": "<high|medium|low>"
  },
  "responsible": {
    "decision_impact_level": "<informational|advisory|decision_support|autonomous>",
    "explainability_required": <bool>,
    "bias_risk_factors": ["<factor1>", "<factor2>"],
    "human_oversight_model": "<none|escalation_only|review_before_action|always_in_loop>",
    "affected_population": "<description>",
    "fairness_criteria": "<criteria>"
  },
  "legal": {
    "regulations": ["<reg1>", "<reg2>"],
    "data_classification": "<public|internal|confidential|restricted>",
    "pii_present": <bool>,
    "phi_present": <bool>,
    "audit_required": <bool>,
    "cross_border_flows": <bool>,
    "liability_model": "<model>",
    "ip_concerns": "<concerns>"
  },
  "data_readiness": {
    "data_sources": ["<source1>", "<source2>"],
    "quality_score": "<high|medium|low|unknown>",
    "golden_dataset_exists": <bool>,
    "golden_dataset_size": <int|null>,
    "labeling_status": "<none|partial|complete>",
    "freshness": "<real-time|daily|weekly|static>",
    "corpus_document_count": <int|null>,
    "pipeline_maturity": "<none|ad_hoc|managed|automated|optimized>"
  },
  "overall_risk_posture": "<low|medium|high|critical>",
  "estimated_complexity": "<simple|moderate|complex>",
  "recommended_tier": "<tier_1|tier_2|tier_3>"
}`;
