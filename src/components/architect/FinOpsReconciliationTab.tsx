"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fmt(n: number | null | undefined): string {
  if (n == null) return "\u2014";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const STATUS_COLORS: Record<string, string> = {
  within_budget: "text-green-600 dark:text-green-400",
  over_budget: "text-orange-600 dark:text-orange-400",
  under_budget: "text-blue-600 dark:text-blue-400",
  anomaly: "text-red-600 dark:text-red-400",
};

interface FinOpsReconciliationTabProps {
  finopsOutput: Record<string, unknown>;
  useCaseId: string;
}

export function FinOpsReconciliationTab({
  finopsOutput,
  useCaseId,
}: FinOpsReconciliationTabProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  }, [finopsOutput, useCaseId]);

  useEffect(() => {
    runReconciliation();
  }, [runReconciliation]);

  if (loading) {
    return (
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          <span className="ml-3 text-gray-500">Running cost reconciliation...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
        <div className="text-red-600 dark:text-red-400 text-sm">Reconciliation failed: {error}</div>
        <Button variant="link" onClick={runReconciliation} className="mt-2">Retry</Button>
      </Card>
    );
  }

  if (!data) return <Card className="p-6 dark:bg-gray-900"><p className="text-gray-500 text-sm">No reconciliation data available.</p></Card>;

  const varianceLines = (data.variance_lines ?? data.varianceLines) as Record<string, unknown>[];
  const anomalies = (data.anomalies as Record<string, unknown>[]) ?? [];
  const trendData = (data.trend_data ?? data.trendData) as Record<string, unknown>[] | undefined;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Projected</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{fmt(data.totalProjected as number)}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Actual</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{fmt(data.totalActual as number)}</p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Variance</p>
          <p className={`text-2xl font-bold mt-1 ${(data.totalVariancePercent as number) > 5 ? "text-red-500" : (data.totalVariancePercent as number) < -5 ? "text-blue-500" : "text-green-500"}`}>
            {(data.totalVariancePercent as number) > 0 ? "+" : ""}{data.totalVariancePercent}%
          </p>
        </Card>
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Anomalies</p>
          <p className={`text-2xl font-bold mt-1 ${anomalies.length > 0 ? "text-red-500" : "text-green-500"}`}>
            {anomalies.length}
          </p>
        </Card>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <Card className="p-4 dark:bg-gray-900 border-red-200 dark:border-red-800/50">
          <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-3">Anomaly Alerts</h3>
          <div className="space-y-2">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-red-500">!</span>
                <span className="text-gray-700 dark:text-gray-300">{a.message as string}</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {((a.variance_percent ?? a.variancePercent) as number)?.toFixed(1)}% variance
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Variance Table */}
      <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-base font-semibold dark:text-white mb-4">Cost Variance Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Projected</th>
                <th className="pb-3 text-right">Actual</th>
                <th className="pb-3 text-right">Variance</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {varianceLines?.map((line, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-3 dark:text-white font-medium">
                    {(line.category as string).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td className="py-3 text-right text-gray-500">{fmt((line.projected_monthly ?? line.projectedMonthly) as number)}</td>
                  <td className="py-3 text-right dark:text-gray-300">{fmt((line.actual_monthly ?? line.actualMonthly) as number)}</td>
                  <td className={`py-3 text-right font-medium ${(line.variance_percent ?? line.variancePercent as number) > 0 ? "text-red-500" : "text-green-500"}`}>
                    {((line.variance_percent ?? line.variancePercent) as number) > 0 ? "+" : ""}{(line.variance_percent ?? line.variancePercent) as number}%
                  </td>
                  <td className="py-3 text-right">
                    <span className={`text-xs ${STATUS_COLORS[(line.status as string)] ?? "text-gray-400"}`}>
                      {(line.status as string).replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trend */}
      {trendData && trendData.length > 0 && (
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-semibold dark:text-white mb-4">Spend Trend (Last 6 Months)</h3>
          <div className="space-y-2">
            {trendData.map((t, i) => {
              const max = Math.max(...trendData.map((d) => Math.max(d.projected as number, d.actual as number)));
              const projWidth = max > 0 ? ((t.projected as number) / max) * 100 : 0;
              const actWidth = max > 0 ? ((t.actual as number) / max) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">{t.month as string}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-blue-200 dark:bg-blue-600/40" style={{ width: `${projWidth}%` }} />
                      <span className="text-xs text-gray-500">{fmt(t.projected as number)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-blue-500 dark:bg-blue-400" style={{ width: `${actWidth}%` }} />
                      <span className="text-xs text-gray-500">{fmt(t.actual as number)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Narrative */}
      {data.narrative && (
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-semibold dark:text-white mb-3">Reconciliation Narrative</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{data.narrative as string}</p>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={runReconciliation} disabled={loading}>
          Refresh Reconciliation
        </Button>
      </div>
    </div>
  );
}
