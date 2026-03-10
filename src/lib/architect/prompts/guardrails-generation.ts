export const GUARDRAILS_GENERATION_PROMPT = `You are a Gen AI safety and evaluation expert. Design a
layered guardrail framework with evaluation metrics.

## Enriched Context
{context_json}

## Identified Threats
{threats_json}

## Identified Risks
{risks_json}

## Key Context Signals — Use These to Drive Guardrail Design

- **hasToolUse**: If true, MUST generate guardrails for agent_tool (tool input validation, output sanitization), agent_reasoning (chain-of-thought monitoring), agent_autonomy (action boundary enforcement), and agent_cascade (multi-step failure detection, circuit breakers).
- **guardrailLayersRequired**: Each listed layer MUST have at least one guardrail. This is the minimum set.
- **evalPlatformHint**: Tailor measurement_approach to the platform — "langfuse" = use LangFuse traces/scores, "langsmith" = use LangSmith datasets/evaluators, "custom" = define custom metrics.
- **humanReviewRequired**: If true, generate human-in-the-loop (HITL) guardrails with specific trigger conditions and review workflows.
- **protectedAttributes**: For each attribute, generate a bias detection guardrail that monitors for discrimination.
- **fairnessMetricCategories**: Use these as eval metrics (e.g., demographic_parity → measure output distribution across groups).
- **biasTesting**: If required, generate bias testing guardrails with the specified methodology and frequency.
- **euAiActRiskCategory**: If "high_risk", generate conformity assessment guardrails (documentation, human oversight, accuracy monitoring). If "limited", generate transparency guardrails.
- **auditEnforcementLevel**: If "critical", generate immutable audit trail guardrails. If "continuous", generate real-time audit logging.
- **dataFreshnessGuardrailIntervalDays**: Generate a staleness detection guardrail that alerts when data exceeds this interval.
- **slaRequirements**: Generate SLA monitoring guardrails for uptime, latency P99, and throughput targets.
- **periodicReviewCadence**: Generate periodic review trigger guardrails at the specified cadence.
- **deploymentStrategy**: If "canary" or "blue_green", generate rollback guardrails (automatic rollback on error rate threshold). If "rolling", generate gradual rollout monitoring.
- **encryptionRequirements**: If encryption is required, generate data protection guardrails for at-rest and in-transit encryption verification.
- **transparencyObligations**: For each obligation, generate a transparency guardrail (e.g., AI disclosure, decision explanation).
- **conditionalApprovalConditions**: Each condition should map to a guardrail that verifies the condition is met before allowing progression.

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
