export const RISK_GENERATION_PROMPT = `You are a Gen AI risk assessment expert. Given the enriched context
for a use case, generate a comprehensive risk register.

## Enriched Context
{context_json}

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

export const THREAT_GENERATION_PROMPT = `You are a Gen AI security expert specializing in threat modeling.
Apply STRIDE methodology adapted for AI systems.

## Enriched Context
{context_json}

## Architecture Components
{components_json}

## Instructions
Analyze each component and data flow for threats. Produce:

{
  "threat_posture": "<low|medium|high|critical>",
  "threats": [
    {
      "id": "THREAT-001",
      "stride_category": "<spoofing|tampering|repudiation|info_disclosure|dos|elevation>",
      "threat_name": "<short name>",
      "description": "<specific description>",
      "attack_vector": "<how the attack would be executed>",
      "severity": "<low|medium|high|critical>",
      "affected_components": ["<component_id>"],
      "source_pillar": "<pillar that makes this threat relevant>",
      "recommended_controls": ["<control1>", "<control2>"]
    }
  ],
  "attack_surface_summary": "<1 paragraph summarizing the overall attack surface>",
  "narrative": "<2-3 paragraph threat assessment narrative>"
}

Generate 10-18 threats covering all STRIDE categories.
Severity should be calibrated to context: customer-facing + PII = higher severity.
Agent/tool use = elevation of privilege threats are critical.`;

export const GUARDRAILS_GENERATION_PROMPT = `You are a Gen AI safety and evaluation expert. Design a
layered guardrail framework with evaluation metrics.

## Enriched Context
{context_json}

## Identified Threats
{threats_json}

## Instructions
For each threat, recommend guardrails. Layer them: input, retrieval, generation, agent_tool, observability.
Also define evaluation metrics for each layer.

Produce:
{
  "coverage_score": <0-100>,
  "guardrails": [
    {
      "id": "GR-001",
      "layer": "<input|retrieval|generation|agent_tool|observability>",
      "name": "<short name>",
      "description": "<what it does>",
      "implementation_guidance": "<specific implementation approach>",
      "priority": "<must_have|should_have|nice_to_have>",
      "source_threat_ids": ["THREAT-001"],
      "source_pillar": "<pillar driving this requirement>"
    }
  ],
  "eval_metrics": [
    {
      "id": "EVAL-001",
      "layer": "<layer>",
      "metric_name": "<name>",
      "description": "<what it measures>",
      "target_value": "<target>",
      "measurement_approach": "<how to measure>"
    }
  ],
  "narrative": "<2-3 paragraph guardrails and eval strategy narrative>"
}

Ensure every identified threat has at least one guardrail.
Responsible/Ethical pillar inputs should drive bias detection and explainability guardrails.
Data Readiness pillar should drive data quality guardrails.`;
