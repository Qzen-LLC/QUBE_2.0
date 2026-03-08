"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, ChartLegend, Filler);

interface HistoryRecord {
  id: string;
  reconciledAt: string;
  totalProjected: number;
  totalActual: number;
  totalVariancePercent: number;
  source: string;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

interface ReconciliationResult {
  source: string;
  totalProjected: number;
  totalActual: number;
  totalVariancePercent: number;
  varianceLines: Array<{
    category: string;
    projectedMonthly: number;
    actualMonthly: number;
    variancePercent: number;
    status: string;
  }>;
  anomalies: Array<{ category: string; variance_percent: number; message: string }>;
  narrative: string;
  reconciledAt: string;
}

interface FinOpsReconciliationTabProps {
  finopsOutput: Record<string, unknown>;
  useCaseId: string;
  onReconciled?: () => void;
  initialData?: ReconciliationResult | null;
}

export function FinOpsReconciliationTab({
  finopsOutput,
  useCaseId,
  onReconciled,
  initialData,
}: FinOpsReconciliationTabProps) {
  const [data, setData] = useState<ReconciliationResult | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagSaved, setTagSaved] = useState(false);

  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Sync initialData when it changes (e.g. page refetch)
  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  // Fetch reconciliation history for trend chart
  useEffect(() => {
    fetch(`/api/production/finops/reconcile/history?useCaseId=${useCaseId}&limit=12`)
      .then((r) => (r.ok ? r.json() : []))
      .then((records) => {
        if (Array.isArray(records)) setHistory(records);
      })
      .catch(() => {});
  }, [useCaseId, data]);

  // Load existing tag config
  useEffect(() => {
    fetch(`/api/production/setup?useCaseId=${useCaseId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((cfg) => {
        if (cfg?.costAllocationTagKey) setTagKey(cfg.costAllocationTagKey);
        if (cfg?.costAllocationTagValue) setTagValue(cfg.costAllocationTagValue);
      })
      .catch(() => {});
  }, [useCaseId]);

  // Extract projected costs from finopsOutput
  const totalProjected = (finopsOutput?.totalMonthlyCost ?? finopsOutput?.summaryMonthlyMid ?? finopsOutput?.summary_monthly_mid) as number | undefined;
  const lineItems = (finopsOutput?.lineItems ?? finopsOutput?.line_items) as Record<string, unknown>[] | undefined;

  const projectedLines = (lineItems ?? []).map((item) => ({
    category: ((item.category as string) ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: (item.monthlyCostMid ?? item.monthly_cost_mid) as number | undefined,
  })).filter(l => l.value != null && l.value > 0);

  const runReconciliation = useCallback(async () => {
    if (!finopsOutput) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/production/finops/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useCaseId,
          finopsOutput,
          periodDays: 30,
        }),
      });
      if (!res.ok) throw new Error("Reconciliation failed");
      const result = await res.json();
      setData(result);
      onReconciled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  }, [finopsOutput, useCaseId, onReconciled]);

  const isConnected = data != null && data.source !== "simulated";

  return (
    <div className="space-y-6">
      {/* Header with title and Run button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cost Reconciliation</h2>
          {data?.reconciledAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last reconciled: {new Date(data.reconciledAt).toLocaleString()}
              {isConnected && <span className="ml-1">· {data.source}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-500">{error}</span>}
          <Button onClick={runReconciliation} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Running..." : "Run Reconciliation"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Projected</p>
          <p className="text-2xl font-bold dark:text-white mt-1">
            {isConnected ? fmt(data.totalProjected) : fmt(totalProjected)}
          </p>
        </Card>
        {isConnected ? (
          <>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Actual</p>
              <p className="text-2xl font-bold dark:text-white mt-1">{fmt(data.totalActual)}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Variance</p>
              <p className={`text-2xl font-bold mt-1 ${data.totalVariancePercent > 0 ? "text-red-500" : "text-green-500"}`}>
                {data.totalVariancePercent > 0 ? "+" : ""}{fmtPct(data.totalVariancePercent)}
              </p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Anomalies</p>
              <p className="text-2xl font-bold dark:text-white mt-1">
                {data.anomalies?.length ?? 0}
              </p>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800 border-dashed">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Actual</p>
              <p className="text-lg text-gray-400 dark:text-gray-500 mt-1">Pending</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">MCP connection required</p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800 border-dashed">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Variance</p>
              <p className="text-lg text-gray-400 dark:text-gray-500 mt-1">Pending</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">MCP connection required</p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800 border-dashed">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Anomalies</p>
              <p className="text-lg text-gray-400 dark:text-gray-500 mt-1">Pending</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600">MCP connection required</p>
            </Card>
          </>
        )}
      </div>

      {/* Cost Breakdown Table */}
      {isConnected && data.varianceLines?.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Projected</th>
                <th className="text-right py-2 font-medium">Actual</th>
                <th className="text-right py-2 font-medium">Variance</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.varianceLines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 capitalize dark:text-white font-medium">
                    {(line.category ?? "").replace(/_/g, " ")}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">{fmt(line.projectedMonthly)}</td>
                  <td className="py-2 text-right dark:text-white">{fmt(line.actualMonthly)}</td>
                  <td className={`py-2 text-right ${(line.variancePercent ?? 0) > 0 ? "text-red-500" : "text-green-500"}`}>
                    {(line.variancePercent ?? 0) > 0 ? "+" : ""}{fmtPct(line.variancePercent ?? 0)}
                  </td>
                  <td className="py-2 text-right">
                    <Badge variant={
                      line.status === "over_budget" || line.status === "anomaly" ? "destructive" :
                      line.status === "under_budget" ? "secondary" : "outline"
                    }>
                      {(line.status ?? "unknown").replace(/_/g, " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : projectedLines.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Projected (Monthly)</th>
                <th className="text-right py-2 font-medium">Actual</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projectedLines.map((line, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 dark:text-white font-medium">{line.category}</td>
                  <td className="py-2 text-right text-muted-foreground">{fmt(line.value)}</td>
                  <td className="py-2 text-right text-gray-400 dark:text-gray-500 italic">Pending</td>
                  <td className="py-2 text-right">
                    <span className="text-xs text-gray-400">awaiting data</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Reconciliation Trend Chart */}
      {history.length > 1 && (() => {
        const sorted = [...history].sort(
          (a, b) => new Date(a.reconciledAt).getTime() - new Date(b.reconciledAt).getTime()
        );
        const labels = sorted.map((r) => {
          const d = new Date(r.reconciledAt);
          return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        });
        return (
          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <p className="text-sm font-semibold mb-3">Projected vs Actual Trend</p>
            <div style={{ height: 240 }}>
              <Line
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Projected",
                      data: sorted.map((r) => r.totalProjected),
                      borderColor: "rgba(100, 116, 139, 0.8)",
                      borderDash: [6, 4],
                      backgroundColor: "transparent",
                      pointRadius: 4,
                      borderWidth: 2,
                      tension: 0.2,
                    },
                    {
                      label: "Actual",
                      data: sorted.map((r) => r.totalActual),
                      borderColor: "rgba(59, 130, 246, 1)",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      fill: true,
                      pointRadius: 4,
                      borderWidth: 2,
                      tension: 0.2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => fmt(Number(value)),
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>
        );
      })()}

      {/* Narrative */}
      {isConnected && data.narrative && (
        <p className="text-sm text-muted-foreground">{data.narrative}</p>
      )}

      {/* MCP Connection Banner (only when not connected) */}
      {!isConnected && (
        <Card className="p-5 dark:bg-gray-900 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-500 text-lg">&#9888;</div>
            <div>
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Cloud Cost Data Not Connected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                To view actual costs, variance analysis, anomaly detection, and spend trends, connect your cloud provider via MCP (Model Context Protocol).
              </p>
              <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <p>Supported providers: <strong>AWS Cost Explorer</strong>, <strong>Azure Cost Management</strong>, <strong>GCP Billing</strong></p>
                <p>Once connected, click &quot;Run Reconciliation&quot; to pull actual costs and compare against projections.</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cost Allocation Tag Configuration */}
      <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
        <button
          onClick={() => setTagOpen(!tagOpen)}
          className="flex items-center gap-2 text-sm font-semibold dark:text-white w-full text-left"
        >
          <span className={`transition-transform ${tagOpen ? "rotate-90" : ""}`}>&#9654;</span>
          Configure Cost Allocation Tag
          {tagKey && tagValue && (
            <span className="text-xs font-normal text-gray-500 ml-2">
              ({tagKey} = {tagValue})
            </span>
          )}
        </button>
        {tagOpen && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pre-configure your cost allocation tag so reconciliation filters costs to this use case.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tag Key</label>
                <input
                  type="text"
                  value={tagKey}
                  onChange={(e) => { setTagKey(e.target.value); setTagSaved(false); }}
                  placeholder="e.g. QubeUseCase"
                  className="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tag Value</label>
                <input
                  type="text"
                  value={tagValue}
                  onChange={(e) => { setTagValue(e.target.value); setTagSaved(false); }}
                  placeholder="e.g. AIUC-1"
                  className="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={tagSaving}
                onClick={async () => {
                  setTagSaving(true);
                  try {
                    await fetch("/api/production/setup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        useCaseId,
                        costAllocationTagKey: tagKey || null,
                        costAllocationTagValue: tagValue || null,
                      }),
                    });
                    setTagSaved(true);
                  } catch {}
                  setTagSaving(false);
                }}
              >
                {tagSaving ? "Saving..." : "Save Tag"}
              </Button>
              {tagSaved && <span className="text-xs text-green-600 dark:text-green-400">Saved!</span>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
