"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GUARDRAIL_LAYERS, type GuardrailLayerKey } from "@/lib/architect/models/layers";

interface MetricEntry {
  metricName: string;
  targetValue?: string;
  passRate?: number;
  status?: string;
}

interface ControlEntry {
  guardrailId: string;
  guardrailName: string;
  layer: string;
  priority: string;
  metrics: MetricEntry[];
}

interface ChainEntry {
  risk: {
    id: string;
    name: string;
    category: string;
    severity: string;
    evalDerivedSeverity?: string;
  };
  controls: ControlEntry[];
  overallStatus: "compliant" | "at_risk" | "non_compliant";
}

interface ThreatChainEntry {
  threat: {
    id: string;
    name: string;
    strideCategory: string;
    severity: string;
  };
  controls: ControlEntry[];
  overallStatus: "compliant" | "at_risk" | "non_compliant";
}

interface ControlFrameworkData {
  chains: ChainEntry[];
  threatChains?: ThreatChainEntry[];
  coveredRisks: number;
  uncoveredRisks: number;
  coveredThreats?: number;
  uncoveredThreats?: number;
  complianceScore: number;
  alerts: { level: string; message: string }[];
}

const STATUS_COLORS = {
  compliant: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  at_risk: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  non_compliant: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
};

const STATUS_LABELS = {
  compliant: "Compliant",
  at_risk: "At Risk",
  non_compliant: "Non-Compliant",
};

const ALERT_COLORS: Record<string, string> = {
  critical: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
  warning: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
};

function getLayerLabel(layer: string): string {
  return (GUARDRAIL_LAYERS as Record<string, { label: string }>)[layer]?.label ?? layer.replace(/_/g, " ");
}

interface ControlFrameworkTabProps {
  useCaseId: string;
}

export function ControlFrameworkTab({ useCaseId }: ControlFrameworkTabProps) {
  const [data, setData] = useState<ControlFrameworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRisks, setExpandedRisks] = useState<Set<string>>(new Set());
  const [expandedThreats, setExpandedThreats] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/architect/control-framework?useCaseId=${useCaseId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Failed to load");
        }
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load control framework");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [useCaseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <p className="text-gray-500">{error ?? "No control framework data available."}</p>
      </Card>
    );
  }

  const toggleExpand = (riskId: string) => {
    setExpandedRisks((prev) => {
      const next = new Set(prev);
      if (next.has(riskId)) next.delete(riskId);
      else next.add(riskId);
      return next;
    });
  };

  const toggleThreatExpand = (threatId: string) => {
    setExpandedThreats((prev) => {
      const next = new Set(prev);
      if (next.has(threatId)) next.delete(threatId);
      else next.add(threatId);
      return next;
    });
  };

  const criticalAlerts = data.alerts.filter((a) => a.level === "critical");

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Compliance Score</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{data.complianceScore}%</p>
        </Card>
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Covered Risks</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{data.coveredRisks}</p>
        </Card>
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Uncovered Risks</p>
          <p className={`text-2xl font-bold mt-1 ${data.uncoveredRisks > 0 ? "text-red-600 dark:text-red-400" : "dark:text-white"}`}>
            {data.uncoveredRisks}
          </p>
        </Card>
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Covered Threats</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{data.coveredThreats ?? 0}</p>
        </Card>
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Uncovered Threats</p>
          <p className={`text-2xl font-bold mt-1 ${(data.uncoveredThreats ?? 0) > 0 ? "text-red-600 dark:text-red-400" : "dark:text-white"}`}>
            {data.uncoveredThreats ?? 0}
          </p>
        </Card>
        <Card className="p-5 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${criticalAlerts.length > 0 ? "text-red-600 dark:text-red-400" : "dark:text-white"}`}>
            {data.alerts.length}
          </p>
        </Card>
      </div>

      {/* Alert Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Critical Alerts</h4>
          <ul className="space-y-1">
            {criticalAlerts.map((a, i) => (
              <li key={i} className="text-sm text-red-600 dark:text-red-300">&bull; {a.message}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Control Chain Table */}
      <Card className="p-6 rounded-xl dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Risk-Control-Metric Traceability</h3>
        <div className="space-y-3">
          {data.chains.map((chain) => (
            <div key={chain.risk.id} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
              {/* Risk Row */}
              <button
                onClick={() => toggleExpand(chain.risk.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500">{chain.risk.id}</span>
                  <span className="text-sm font-semibold dark:text-white">{chain.risk.name}</span>
                  <span className="text-xs text-gray-400">{chain.risk.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Severity badges */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Assessed:</span>
                    <SeverityBadge severity={chain.risk.severity} />
                    {chain.risk.evalDerivedSeverity && chain.risk.evalDerivedSeverity.toLowerCase() !== chain.risk.severity.toLowerCase() && (
                      <>
                        <span className="text-xs text-gray-400">&rarr;</span>
                        <span className="text-xs text-gray-500">Live:</span>
                        <SeverityBadge severity={chain.risk.evalDerivedSeverity} />
                      </>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[chain.overallStatus]}`}>
                    {STATUS_LABELS[chain.overallStatus]}
                  </span>
                  <span className="text-gray-400 text-sm">{expandedRisks.has(chain.risk.id) ? "\u25B2" : "\u25BC"}</span>
                </div>
              </button>

              {/* Expanded Details */}
              {expandedRisks.has(chain.risk.id) && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/20">
                  {chain.controls.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No guardrails linked to this risk</p>
                  ) : (
                    <div className="space-y-3">
                      {chain.controls.map((ctrl) => (
                        <div key={ctrl.guardrailId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-500">{ctrl.guardrailId}</span>
                              <span className="text-sm font-medium dark:text-white">{ctrl.guardrailName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {getLayerLabel(ctrl.layer)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                ctrl.priority === "must_have" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                ctrl.priority === "should_have" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                "bg-gray-100 dark:bg-gray-800 text-gray-500"
                              }`}>{ctrl.priority.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                          {ctrl.metrics.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {ctrl.metrics.map((m, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-gray-50 dark:border-gray-800">
                                  <span className="text-gray-600 dark:text-gray-400">{m.metricName}</span>
                                  <div className="flex items-center gap-3">
                                    {m.targetValue && <span className="text-gray-400">Target: {m.targetValue}</span>}
                                    {m.passRate != null && (
                                      <span className={`font-mono ${
                                        m.status === "passing" ? "text-green-600 dark:text-green-400" :
                                        m.status === "degraded" ? "text-amber-600 dark:text-amber-400" :
                                        m.status === "failing" ? "text-red-600 dark:text-red-400" :
                                        "text-gray-500"
                                      }`}>{m.passRate}%</span>
                                    )}
                                    {m.status && (
                                      <MetricStatusDot status={m.status} />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {ctrl.metrics.length === 0 && (
                            <p className="text-xs text-gray-400 italic mt-1">No eval metrics for this layer</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Threat Chain Table */}
      {data.threatChains && data.threatChains.length > 0 && (
        <Card className="p-6 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-4">Threat-Control-Metric Traceability</h3>
          <div className="space-y-3">
            {data.threatChains.map((chain) => (
              <div key={chain.threat.id} className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
                {/* Threat Row */}
                <button
                  onClick={() => toggleThreatExpand(chain.threat.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500">{chain.threat.id}</span>
                    <span className="text-sm font-semibold dark:text-white">{chain.threat.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      {chain.threat.strideCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={chain.threat.severity} />
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[chain.overallStatus]}`}>
                      {STATUS_LABELS[chain.overallStatus]}
                    </span>
                    <span className="text-gray-400 text-sm">{expandedThreats.has(chain.threat.id) ? "\u25B2" : "\u25BC"}</span>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedThreats.has(chain.threat.id) && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-800/20">
                    {chain.controls.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No guardrails linked to this threat</p>
                    ) : (
                      <div className="space-y-3">
                        {chain.controls.map((ctrl) => (
                          <div key={ctrl.guardrailId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500">{ctrl.guardrailId}</span>
                                <span className="text-sm font-medium dark:text-white">{ctrl.guardrailName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  {getLayerLabel(ctrl.layer)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  ctrl.priority === "must_have" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                  ctrl.priority === "should_have" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                  "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                }`}>{ctrl.priority.replace(/_/g, " ")}</span>
                              </div>
                            </div>
                            {ctrl.metrics.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {ctrl.metrics.map((m, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-gray-50 dark:border-gray-800">
                                    <span className="text-gray-600 dark:text-gray-400">{m.metricName}</span>
                                    <div className="flex items-center gap-3">
                                      {m.targetValue && <span className="text-gray-400">Target: {m.targetValue}</span>}
                                      {m.passRate != null && (
                                        <span className={`font-mono ${
                                          m.status === "passing" ? "text-green-600 dark:text-green-400" :
                                          m.status === "degraded" ? "text-amber-600 dark:text-amber-400" :
                                          m.status === "failing" ? "text-red-600 dark:text-red-400" :
                                          "text-gray-500"
                                        }`}>{m.passRate}%</span>
                                      )}
                                      {m.status && (
                                        <MetricStatusDot status={m.status} />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {ctrl.metrics.length === 0 && (
                              <p className="text-xs text-gray-400 italic mt-1">No eval metrics for this layer</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Alerts */}
      {data.alerts.length > 0 && (
        <Card className="p-6 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-lg font-semibold dark:text-white mb-3">All Alerts</h3>
          <div className="space-y-2">
            {data.alerts.map((a, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded border ${ALERT_COLORS[a.level] ?? ALERT_COLORS.info}`}>
                <span className="font-medium uppercase text-xs mr-2">{a.level}</span>
                {a.message}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    high: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    medium: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
    low: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[severity.toLowerCase()] ?? "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
      {severity}
    </span>
  );
}

function MetricStatusDot({ status }: { status: string }) {
  const color =
    status === "passing" ? "bg-green-500" :
    status === "degraded" ? "bg-amber-500" :
    status === "failing" ? "bg-red-500" :
    "bg-gray-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}
