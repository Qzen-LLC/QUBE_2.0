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
