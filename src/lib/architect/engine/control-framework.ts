import type { ArchitectureOutput, GuardrailItem, EvalMetric } from "../models/outputs";
import type { EvalsMonitoringOutput } from "../models/production";

export interface ControlChainEntry {
  risk: {
    id: string;
    name: string;
    category: string;
    severity: string;
    evalDerivedSeverity?: string;
  };
  controls: {
    guardrailId: string;
    guardrailName: string;
    layer: string;
    priority: string;
    metrics: {
      metricName: string;
      targetValue?: string;
      passRate?: number;
      status?: string;
    }[];
  }[];
  overallStatus: "compliant" | "at_risk" | "non_compliant";
}

export interface ThreatChainEntry {
  threat: {
    id: string;
    name: string;
    strideCategory: string;
    severity: string;
  };
  controls: ControlChainEntry["controls"][number][];
  overallStatus: "compliant" | "at_risk" | "non_compliant";
}

export interface ControlFrameworkOutput {
  chains: ControlChainEntry[];
  threatChains: ThreatChainEntry[];
  coveredRisks: number;
  uncoveredRisks: number;
  coveredThreats: number;
  uncoveredThreats: number;
  complianceScore: number;
  alerts: { level: string; message: string }[];
}

export function buildControlFramework(
  architectureOutput: ArchitectureOutput,
  evalOutput?: EvalsMonitoringOutput
): ControlFrameworkOutput {
  const { risk, guardrails: guardrailsData } = architectureOutput;
  const allGuardrails = guardrailsData.guardrails;
  const allMetrics = guardrailsData.evalMetrics;

  // Build eval results lookup by metric name
  const evalResultsByMetric = new Map<string, { passRate: number; status: string }>();
  if (evalOutput) {
    for (const result of evalOutput.guardrailResults) {
      evalResultsByMetric.set(result.metricName, {
        passRate: result.passRate,
        status: result.status,
      });
    }
  }

  // Build metric lookup by layer
  const metricsByLayer = new Map<string, EvalMetric[]>();
  for (const m of allMetrics) {
    const existing = metricsByLayer.get(m.layer) ?? [];
    existing.push(m);
    metricsByLayer.set(m.layer, existing);
  }

  const chains: ControlChainEntry[] = [];
  const alerts: { level: string; message: string }[] = [];
  let coveredRisks = 0;
  let uncoveredRisks = 0;

  for (const r of risk.risks) {
    // Find guardrails linked to this risk
    const linkedGuardrails = allGuardrails.filter(
      (g) => g.sourceRiskIds && g.sourceRiskIds.includes(r.id)
    );

    if (linkedGuardrails.length === 0) {
      uncoveredRisks++;
      alerts.push({
        level: "warning",
        message: `Risk "${r.name}" (${r.id}) has no linked guardrails`,
      });

      chains.push({
        risk: {
          id: r.id,
          name: r.name,
          category: r.category,
          severity: r.severity,
        },
        controls: [],
        overallStatus: "non_compliant",
      });
      continue;
    }

    coveredRisks++;

    // Build controls with metrics
    const controls = linkedGuardrails.map((g) => {
      const layerMetrics = metricsByLayer.get(g.layer) ?? [];
      const metrics = layerMetrics.map((m) => {
        const evalResult = evalResultsByMetric.get(m.metricName);
        return {
          metricName: m.metricName,
          targetValue: m.targetValue ?? undefined,
          passRate: evalResult?.passRate,
          status: evalResult?.status,
        };
      });

      return {
        guardrailId: g.id,
        guardrailName: g.name,
        layer: g.layer,
        priority: g.priority,
        metrics,
      };
    });

    // Check if any control has no metrics
    const unmeasuredControls = controls.filter((c) => c.metrics.length === 0);
    if (unmeasuredControls.length > 0) {
      alerts.push({
        level: "info",
        message: `Risk "${r.name}": ${unmeasuredControls.length} guardrail(s) have no eval metrics`,
      });
    }

    // Determine overall status
    const allMetricStatuses = controls.flatMap((c) =>
      c.metrics.map((m) => m.status).filter(Boolean)
    );
    const hasFailing = allMetricStatuses.includes("failing");
    const hasDegraded = allMetricStatuses.includes("degraded");

    let overallStatus: ControlChainEntry["overallStatus"] = "compliant";
    if (hasFailing) {
      overallStatus = "non_compliant";
      alerts.push({
        level: "critical",
        message: `Risk "${r.name}" (${r.id}) has failing eval metrics — non-compliant`,
      });
    } else if (hasDegraded) {
      overallStatus = "at_risk";
    }

    chains.push({
      risk: {
        id: r.id,
        name: r.name,
        category: r.category,
        severity: r.severity,
      },
      controls,
      overallStatus,
    });
  }

  // ── Threat Chains ──────────────────────────────────────
  const threatChains: ThreatChainEntry[] = [];
  let coveredThreats = 0;
  let uncoveredThreats = 0;

  const allThreats = architectureOutput.threat?.threats ?? [];

  for (const t of allThreats) {
    const linkedGuardrails = allGuardrails.filter(
      (g) => g.sourceThreatIds && g.sourceThreatIds.includes(t.id)
    );

    if (linkedGuardrails.length === 0) {
      uncoveredThreats++;
      alerts.push({
        level: "warning",
        message: `Threat "${t.threatName}" (${t.id}) has no linked guardrails`,
      });

      threatChains.push({
        threat: {
          id: t.id,
          name: t.threatName,
          strideCategory: t.strideCategory,
          severity: t.severity,
        },
        controls: [],
        overallStatus: "non_compliant",
      });
      continue;
    }

    coveredThreats++;

    const controls = linkedGuardrails.map((g) => {
      const layerMetrics = metricsByLayer.get(g.layer) ?? [];
      const metrics = layerMetrics.map((m) => {
        const evalResult = evalResultsByMetric.get(m.metricName);
        return {
          metricName: m.metricName,
          targetValue: m.targetValue ?? undefined,
          passRate: evalResult?.passRate,
          status: evalResult?.status,
        };
      });

      return {
        guardrailId: g.id,
        guardrailName: g.name,
        layer: g.layer,
        priority: g.priority,
        metrics,
      };
    });

    const unmeasuredControls = controls.filter((c) => c.metrics.length === 0);
    if (unmeasuredControls.length > 0) {
      alerts.push({
        level: "info",
        message: `Threat "${t.threatName}": ${unmeasuredControls.length} guardrail(s) have no eval metrics`,
      });
    }

    const allMetricStatuses = controls.flatMap((c) =>
      c.metrics.map((m) => m.status).filter(Boolean)
    );
    const hasFailing = allMetricStatuses.includes("failing");
    const hasDegraded = allMetricStatuses.includes("degraded");

    let overallStatus: ThreatChainEntry["overallStatus"] = "compliant";
    if (hasFailing) {
      overallStatus = "non_compliant";
      alerts.push({
        level: "critical",
        message: `Threat "${t.threatName}" (${t.id}) has failing eval metrics — non-compliant`,
      });
    } else if (hasDegraded) {
      overallStatus = "at_risk";
    }

    threatChains.push({
      threat: {
        id: t.id,
        name: t.threatName,
        strideCategory: t.strideCategory,
        severity: t.severity,
      },
      controls,
      overallStatus,
    });
  }

  const totalRisks = risk.risks.length;
  const compliantCount = chains.filter((c) => c.overallStatus === "compliant").length;
  const complianceScore = totalRisks > 0 ? Math.round((compliantCount / totalRisks) * 100) : 0;

  return {
    chains,
    threatChains,
    coveredRisks,
    uncoveredRisks,
    coveredThreats,
    uncoveredThreats,
    complianceScore,
    alerts,
  };
}
