import { useState, useCallback } from "react";

export type PipelineStep =
  | "idle"
  | "scoring_pillars"
  | "matching_archetype"
  | "enriching_context"
  | "generating_finops"
  | "generating_risks"
  | "generating_threats"
  | "generating_guardrails"
  | "generating_summary"
  | "completed"
  | "failed";

interface PipelineState {
  step: PipelineStep;
  error: string | null;
  output: Record<string, unknown> | null;
  duration: number | null;
}

export function useArchitectPipeline(useCaseId: string | undefined) {
  const [state, setState] = useState<PipelineState>({
    step: "idle",
    error: null,
    output: null,
    duration: null,
  });

  const generate = useCallback(
    async (input: Record<string, unknown>, options?: {
      enrichedContext?: Record<string, unknown>;
      pillarScores?: Record<string, unknown>;
    }) => {
      if (!useCaseId) return;

      setState({ step: "scoring_pillars", error: null, output: null, duration: null });

      try {
        const res = await fetch("/api/architect/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useCaseId,
            input,
            ...(options?.enrichedContext ? { enrichedContext: options.enrichedContext } : {}),
            ...(options?.pillarScores ? { pillarScores: options.pillarScores } : {}),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Pipeline failed");
        }

        const data = await res.json();

        setState({
          step: "completed",
          error: null,
          output: data.output,
          duration: data.duration,
        });

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((s) => ({ ...s, step: "failed", error: message }));
        throw err;
      }
    },
    [useCaseId]
  );

  const scorePillars = useCallback(
    async (input: Record<string, unknown>) => {
      const res = await fetch("/api/architect/score-pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Scoring failed");
      return res.json();
    },
    []
  );

  const reset = useCallback(() => {
    setState({ step: "idle", error: null, output: null, duration: null });
  }, []);

  return {
    ...state,
    isRunning: !["idle", "completed", "failed"].includes(state.step),
    generate,
    scorePillars,
    reset,
  };
}
