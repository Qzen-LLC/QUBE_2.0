export const RISK_GENERATION_PROMPT = `You are a Gen AI risk assessment expert. Given the enriched context
for a use case, generate a comprehensive risk register.

## Enriched Context
{context_json}

## Key Context Signals — Use These to Drive Risk Identification

- **hasToolUse**: If true, generate risks for tool misuse, cascading failure from tool chains, and uncontrolled tool invocation loops.
- **apiSurfaceExposure**: If "public_api", generate risks for public exposure (abuse, rate limit exhaustion, prompt injection at scale). If "partner_api", generate API contract/versioning risks.
- **failoverStrategy**: If "none", generate single-point-of-failure (SPOF) risk. If "active_passive", generate failover delay risk.
- **costExplosionRiskMultiplier**: If > 10, generate a cost explosion risk with the multiplier as the worst-case scenario. Higher multipliers = higher severity.
- **euAiActRiskCategory**: If "high_risk" or "prohibited", generate compliance non-conformity risks. If "high_risk", generate conformity assessment failure risk.
- **regulatoryBurdenScore**: If > 7, generate compliance overhead and resource allocation risks.
- **vendorSupplyChainRiskLevel**: If "high" or "critical", generate vendor lock-in, API deprecation, and supply chain disruption risks.
- **slaRequirements**: If present, generate SLA breach risk calibrated to the specific uptime/latency targets.
- **readinessBlockers**: Each blocker should map to a specific risk (e.g., "No golden dataset" → data quality risk).
- **crossPillarConflicts**: Each conflict should map to a risk (e.g., "Low latency vs multi-region" → architecture trade-off risk).
- **goNoGoRecommendation**: If "no_go", surface all blockers as critical risks. If "conditional_go", surface conditions as high risks.
- **sensitiveDataFlowExists**: If true, generate data breach and unauthorized access risks.
- **dataStalenessRisk**: If "high", generate stale data leading to incorrect outputs risk.
- **budgetCeilingUsdMonthly**: If set, generate budget overrun risk.

## Instructions
Generate a JSON array of risk items. For each risk, assess probability and impact based on
the specific use case context (not generic). Each risk must trace back to a source pillar.

Categories: technical, operational, strategic, compliance

Produce:
{
  "risk_posture": "<low|medium|high|critical>",
  "risks": [
    {
      "id": "RISK-001",
      "category": "<category>",
      "name": "<short name>",
      "description": "<specific description for this use case>",
      "probability": "<low|medium|high|very_high>",
      "impact": "<low|medium|high|critical>",
      "severity": "<low|medium|high|critical>",
      "source_pillar": "<technical|business|responsible|legal|data_readiness>",
      "mitigation": "<specific, actionable mitigation>",
      "owner_suggestion": "<role that should own this risk>"
    }
  ],
  "mitigation_roadmap": [
    "<prioritized action items>"
  ],
  "narrative": "<2-3 paragraph risk assessment narrative>"
}

Generate 8-15 risks covering all categories. Score severity based on probability x impact.
Be specific to this use case - do not produce generic risks.`;
