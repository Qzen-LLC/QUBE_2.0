"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinOpsReconciliationTab } from "./FinOpsReconciliationTab";
import { EvalsMonitoringTab } from "./EvalsMonitoringTab";

function fmt(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  high: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  medium: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  low: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  very_high: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[color] ?? "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"}`}>
      {text}
    </span>
  );
}

const TABS = [
  { id: "summary", label: "Executive Summary" },
  { id: "finops", label: "FinOps" },
  { id: "risk", label: "Risk" },
  { id: "threat", label: "Threat Model" },
  { id: "guardrails", label: "Guardrails & Evals" },
  { id: "reconciliation", label: "Cost Reconciliation" },
  { id: "live_evals", label: "Live Evals" },
];

interface ArchitectOutputDashboardProps {
  output: Record<string, unknown>;
  useCaseId: string;
  onBack?: () => void;
}

export function ArchitectOutputDashboard({
  output,
  useCaseId,
  onBack,
}: ArchitectOutputDashboardProps) {
  const [tab, setTab] = useState("summary");

  if (!output) return <p className="text-gray-500">No output generated yet.</p>;

  const finops = output.finops as Record<string, unknown>;
  const risk = output.risk as Record<string, unknown>;
  const threat = output.threat as Record<string, unknown>;
  const guardrails = output.guardrails as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">{output.useCaseName as string}</h2>
          <p className="text-gray-500 text-sm">
            Architecture Assessment &mdash; {((output.tier as string) ?? "").replace(/_/g, " ").toUpperCase()}
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>Back to Wizard</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-lg overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === t.id
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "summary" && <SummaryTab output={output} />}
      {tab === "finops" && <FinOpsTab data={finops} />}
      {tab === "risk" && <RiskTab data={risk} />}
      {tab === "threat" && <ThreatTab data={threat} />}
      {tab === "guardrails" && <GuardrailsTab data={guardrails} />}
      {tab === "reconciliation" && (
        <FinOpsReconciliationTab finopsOutput={finops} useCaseId={useCaseId} />
      )}
      {tab === "live_evals" && (
        <EvalsMonitoringTab guardrailsOutput={guardrails} useCaseId={useCaseId} />
      )}
    </div>
  );
}

function SummaryTab({ output }: { output: Record<string, unknown> }) {
  const finops = output.finops as Record<string, unknown>;
  const risk = output.risk as Record<string, unknown>;
  const threat = output.threat as Record<string, unknown>;
  const guardrails = output.guardrails as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Run Rate</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{fmt(finops.summaryMonthlyMid as number)}</p>
          <p className="text-xs text-gray-500">{fmt(finops.summaryMonthlyLow as number)} &mdash; {fmt(finops.summaryMonthlyHigh as number)}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Posture</p>
          <p className="text-2xl font-bold dark:text-white mt-1 capitalize">{risk.riskPosture as string}</p>
          <p className="text-xs text-gray-500">{risk.criticalRisks as number} critical / {risk.totalRisks as number} total</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Threat Posture</p>
          <p className="text-2xl font-bold dark:text-white mt-1 capitalize">{threat.threatPosture as string}</p>
          <p className="text-xs text-gray-500">{threat.criticalThreats as number} critical / {threat.totalThreats as number} total</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Guardrail Coverage</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{guardrails.coverageScore as number}%</p>
          <p className="text-xs text-gray-500">{(guardrails.guardrails as unknown[])?.length ?? 0} guardrails defined</p>
        </Card>
      </div>

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white mb-3">Executive Summary</h3>
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {(output.executiveSummary ?? output.executive_summary) as string}
        </div>
      </Card>
    </div>
  );
}

function FinOpsTab({ data }: { data: Record<string, unknown> }) {
  const lineItems = (data.lineItems ?? data.line_items) as Record<string, unknown>[];
  const assumptions = (data.assumptions as string[]) ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Monthly Cost Breakdown</h3>
        <div className="space-y-3">
          {lineItems?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-medium dark:text-white">
                  {(item.category as string).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description as string}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold dark:text-white">{fmt((item.monthlyCostMid ?? item.monthly_cost_mid) as number)}</p>
                <p className="text-xs text-gray-500">{fmt((item.monthlyCostLow ?? item.monthly_cost_low) as number)} &mdash; {fmt((item.monthlyCostHigh ?? item.monthly_cost_high) as number)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 border-t-2 border-gray-200 dark:border-gray-700">
            <p className="text-sm font-bold dark:text-white">Total Monthly</p>
            <div className="text-right">
              <p className="text-lg font-bold dark:text-white">{fmt((data.summaryMonthlyMid ?? data.summary_monthly_mid) as number)}</p>
              <p className="text-xs text-gray-500">{fmt((data.summaryMonthlyLow ?? data.summary_monthly_low) as number)} &mdash; {fmt((data.summaryMonthlyHigh ?? data.summary_monthly_high) as number)}</p>
            </div>
          </div>
        </div>
      </Card>

      {data.narrative && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-3">FinOps Narrative</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.narrative as string}</p>
        </Card>
      )}

      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white mb-3">Assumptions</h3>
        <ul className="space-y-1">
          {assumptions.map((a, i) => (
            <li key={i} className="text-sm text-gray-500">&bull; {a}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function RiskTab({ data }: { data: Record<string, unknown> }) {
  const risks = (data.risks as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Risk Register</h3>
          <Badge text={(data.riskPosture ?? data.risk_posture) as string} color={(data.riskPosture ?? data.risk_posture) as string} />
        </div>
        <div className="space-y-3">
          {risks.map((risk, i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">{risk.id as string}</span>
                  <span className="text-sm font-semibold dark:text-white">{risk.name as string}</span>
                </div>
                <Badge text={risk.severity as string} color={risk.severity as string} />
              </div>
              <p className="text-sm text-gray-500 mb-2">{risk.description as string}</p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Probability: {risk.probability as string}</span>
                <span>Impact: {risk.impact as string}</span>
                <span>Pillar: {(risk.sourcePillar ?? risk.source_pillar) as string}</span>
              </div>
              <div className="mt-2 text-sm text-blue-600 dark:text-blue-300/80">
                <strong className="text-blue-700 dark:text-blue-400">Mitigation:</strong> {risk.mitigation as string}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {data.narrative && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-3">Risk Assessment Narrative</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.narrative as string}</p>
        </Card>
      )}
    </div>
  );
}

function ThreatTab({ data }: { data: Record<string, unknown> }) {
  const threats = (data.threats as Record<string, unknown>[]) ?? [];
  const categories = ["spoofing", "tampering", "repudiation", "info_disclosure", "dos", "elevation"];

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">STRIDE Threat Model</h3>
          <Badge text={(data.threatPosture ?? data.threat_posture) as string} color={(data.threatPosture ?? data.threat_posture) as string} />
        </div>

        {categories.map((cat) => {
          const catThreats = threats.filter((t) => (t.strideCategory ?? t.stride_category) === cat);
          if (catThreats.length === 0) return null;
          return (
            <div key={cat} className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
                {cat.replace(/_/g, " ")} ({catThreats.length})
              </h4>
              <div className="space-y-3">
                {catThreats.map((t, i) => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold dark:text-white">{(t.threatName ?? t.threat_name) as string}</span>
                      <Badge text={t.severity as string} color={t.severity as string} />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{t.description as string}</p>
                    <p className="text-xs text-gray-500">Attack vector: {(t.attackVector ?? t.attack_vector) as string}</p>
                    {((t.recommendedControls ?? t.recommended_controls) as string[])?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {((t.recommendedControls ?? t.recommended_controls) as string[]).map((c, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {data.narrative && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-3">Threat Assessment Narrative</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.narrative as string}</p>
        </Card>
      )}
    </div>
  );
}

function GuardrailsTab({ data }: { data: Record<string, unknown> }) {
  const guardrailItems = (data.guardrails as Record<string, unknown>[]) ?? [];
  const evalMetricsItems = (data.evalMetrics ?? data.eval_metrics) as Record<string, unknown>[] ?? [];
  const layers = ["input", "retrieval", "generation", "agent_tool", "observability"];

  return (
    <div className="space-y-6">
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">Guardrail Framework</h3>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{(data.coverageScore ?? data.coverage_score) as number}% coverage</span>
        </div>

        {layers.map((layer) => {
          const guards = guardrailItems.filter((g) => g.layer === layer);
          if (guards.length === 0) return null;
          return (
            <div key={layer} className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
                {layer.replace(/_/g, " ")} layer ({guards.length})
              </h4>
              <div className="space-y-3">
                {guards.map((g, i) => (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-semibold dark:text-white">{g.name as string}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        g.priority === "must_have" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                        g.priority === "should_have" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      }`}>{((g.priority as string) ?? "").replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{g.description as string}</p>
                    <p className="text-xs text-gray-500">Implementation: {(g.implementationGuidance ?? g.implementation_guidance) as string}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Eval Metrics */}
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Evaluation Metrics</h3>
        <div className="space-y-3">
          {evalMetricsItems.map((m, i) => (
            <div key={i} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-medium dark:text-white">{(m.metricName ?? m.metric_name) as string}</p>
                <p className="text-xs text-gray-500">{m.description as string}</p>
                <p className="text-xs text-gray-400 mt-0.5">Layer: {m.layer as string} | Measurement: {(m.measurementApproach ?? m.measurement_approach) as string}</p>
              </div>
              {(m.targetValue ?? m.target_value) && (
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap ml-4">{(m.targetValue ?? m.target_value) as string}</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {data.narrative && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-3">Guardrails & Eval Strategy</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.narrative as string}</p>
        </Card>
      )}
    </div>
  );
}
