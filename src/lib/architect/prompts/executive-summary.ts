export const EXECUTIVE_SUMMARY_PROMPT = `Generate a concise executive summary for a Gen AI use case
architecture assessment.

## Context
{context_json}

## FinOps Summary
Monthly run rate: $\${finops_low} - $\${finops_high}
Top cost driver: {top_cost_driver}

## Risk Summary
Risk posture: {risk_posture}
Critical risks: {critical_risks}

## Threat Summary
Threat posture: {threat_posture}
Critical threats: {critical_threats}

## Guardrails Summary
Coverage score: {guardrail_coverage}%

## Governance Signals
Go/No-Go Recommendation: {go_no_go}
Strategic Importance: {strategic_importance}
EU AI Act Category: {eu_ai_act_category}
Pilot Recommended: {pilot_recommended}
Readiness Blockers: {readiness_blockers}
Conditional Approval Conditions: {conditional_conditions}

## Instructions
Write a 3-4 paragraph executive summary that:
1. Describes what this use case is and its business value
2. Summarizes the cost outlook and key financial drivers
3. Highlights the top risks and threats with their mitigations
4. Provides a clear go/no-go recommendation with specific conditions

Additional guidance:
- State the go/no-go recommendation prominently with specific conditions that must be met.
- If pilot is recommended, explain why and what the pilot should validate.
- List any readiness blockers that must be resolved before proceeding.
- If the EU AI Act category is "high_risk", mention conformity assessment requirements.
- If strategic importance is "critical", frame the recommendation in terms of competitive advantage or business necessity.

Keep it under 300 words. Write for a leadership audience. Be direct and specific.`;
