export const GUARDRAIL_LAYERS = {
  input: { label: "Input", description: "Pre-processing filters and validation" },
  retrieval: { label: "Retrieval", description: "RAG pipeline controls" },
  generation: { label: "Generation", description: "Output quality and safety controls" },
  agent_tool: { label: "Agent Tool Use", description: "Tool invocation governance" },
  agent_reasoning: { label: "Agent Reasoning", description: "Chain-of-thought monitoring" },
  agent_autonomy: { label: "Agent Autonomy", description: "Action boundary enforcement" },
  agent_cascade: { label: "Agent Cascade", description: "Multi-step failure detection" },
  observability: { label: "Observability", description: "Logging, tracing, and alerting" },
} as const;

export type GuardrailLayerKey = keyof typeof GUARDRAIL_LAYERS;
