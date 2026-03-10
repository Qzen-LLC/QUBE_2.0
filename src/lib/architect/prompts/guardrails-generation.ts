export const GUARDRAILS_GENERATION_PROMPT = `You are a Gen AI safety and evaluation expert. Design a
layered guardrail framework with evaluation metrics.

## Enriched Context
{context_json}

## Identified Threats
{threats_json}

## Identified Risks
{risks_json}

## Instructions
For each threat **and each high/critical risk**, recommend guardrails. Layer them: input, retrieval, generation, agent_tool, agent_reasoning, agent_autonomy, agent_cascade, observability.
Also define evaluation metrics for each layer.

For agentic use cases (agents, copilots, tool-use systems), also generate guardrails for:
- agent_reasoning: chain-of-thought monitoring, reasoning coherence, hallucination-in-reasoning detection
- agent_autonomy: action boundary enforcement, scope limits, human-in-the-loop triggers, permission boundaries
- agent_cascade: multi-step failure detection, input/output chain validation, error propagation limits, circuit breakers
For non-agentic use cases, the agent_* layers may be omitted.

Produce:
{
  "coverage_score": <0-100>,
  "guardrails": [
    {
      "id": "GR-001",
      "layer": "<input|retrieval|generation|agent_tool|agent_reasoning|agent_autonomy|agent_cascade|observability>",
      "name": "<short name>",
      "description": "<what it does>",
      "implementation_guidance": "<specific implementation approach>",
      "priority": "<must_have|should_have|nice_to_have>",
      "source_threat_ids": ["THREAT-001"],
      "source_risk_ids": ["RISK-001"],
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

Ensure every identified threat **and every high/critical risk** has at least one guardrail.
Responsible/Ethical pillar inputs should drive bias detection and explainability guardrails.
Data Readiness pillar should drive data quality guardrails.`;
