import type { EvalsMonitoringOutput } from "../models/production";
import type { GuardrailsOutput } from "../models/outputs";

export interface RiskAdjustment {
  riskId: string;
  originalSeverity: string;
  adjustedSeverity: string;
  reason: string;
  triggeringGuardrails: string[];
  triggeringMetrics: string[];
}

export interface RiskFeedbackOutput {
  adjustments: RiskAdjustment[];
  overallPostureShift: "stable" | "degrading" | "critical";
  summary: string;
}

const SEVERITY_LADDER = ["low", "medium", "high", "critical"];

function escalateSeverity(current: string, levels: number): string {
  const idx = SEVERITY_LADDER.indexOf(current.toLowerCase());
  if (idx === -1) return current;
  const newIdx = Math.min(idx + levels, SEVERITY_LADDER.length - 1);
  return SEVERITY_LADDER[newIdx];
}

export function computeRiskAdjustmentsFromEvals(
  evalOutput: EvalsMonitoringOutput,
  guardrailsOutput: GuardrailsOutput
): RiskFeedbackOutput {
  // Build map: guardrail name → sourceRiskIds
  const guardrailToRiskIds = new Map<string, string[]>();
  for (const g of guardrailsOutput.guardrails) {
    if (g.sourceRiskIds && g.sourceRiskIds.length > 0) {
      guardrailToRiskIds.set(g.name, g.sourceRiskIds);
    }
  }

  // Track worst escalation per risk
  const riskEscalations = new Map<
    string,
    {
      levels: number;
      triggeringGuardrails: string[];
      triggeringMetrics: string[];
      reasons: string[];
    }
  >();

  for (const result of evalOutput.guardrailResults) {
    if (result.status !== "failing" && result.status !== "degraded") continue;

    const riskIds = guardrailToRiskIds.get(result.guardrailName);
    if (!riskIds || riskIds.length === 0) continue;

    const escalationLevels = result.status === "failing" ? 2 : 1;
    const reason =
      result.status === "failing"
        ? `${result.metricName} pass rate at ${result.passRate}% (failing, <70%)`
        : `${result.metricName} pass rate at ${result.passRate}% (degraded, <90%)`;

    for (const riskId of riskIds) {
      const existing = riskEscalations.get(riskId);
      if (existing) {
        existing.levels = Math.max(existing.levels, escalationLevels);
        existing.triggeringGuardrails.push(result.guardrailName);
        existing.triggeringMetrics.push(result.metricName);
        existing.reasons.push(reason);
      } else {
        riskEscalations.set(riskId, {
          levels: escalationLevels,
          triggeringGuardrails: [result.guardrailName],
          triggeringMetrics: [result.metricName],
          reasons: [reason],
        });
      }
    }
  }

  // Build adjustments — we need original severity from guardrails' linked risks
  // Build a riskId → severity map from guardrails output (risks are in the architecture output)
  const adjustments: RiskAdjustment[] = [];

  for (const [riskId, esc] of riskEscalations) {
    // We don't have the original severity here; the caller will look it up.
    // Use "medium" as fallback — the API route will resolve actual severity from DB.
    const originalSeverity = "medium";
    const adjustedSeverity = escalateSeverity(originalSeverity, esc.levels);

    adjustments.push({
      riskId,
      originalSeverity,
      adjustedSeverity,
      reason: esc.reasons.join("; "),
      triggeringGuardrails: [...new Set(esc.triggeringGuardrails)],
      triggeringMetrics: [...new Set(esc.triggeringMetrics)],
    });
  }

  // Determine overall posture shift
  const hasCritical = adjustments.some((a) => a.adjustedSeverity === "critical");
  const hasAny = adjustments.length > 0;
  const overallPostureShift: RiskFeedbackOutput["overallPostureShift"] = hasCritical
    ? "critical"
    : hasAny
      ? "degrading"
      : "stable";

  const summary =
    adjustments.length === 0
      ? "All eval metrics are within acceptable thresholds. Risk posture is stable."
      : `${adjustments.length} risk(s) require severity escalation based on eval metric degradation. ${
          hasCritical ? "CRITICAL: Immediate attention required." : "Review recommended."
        }`;

  return { adjustments, overallPostureShift, summary };
}
