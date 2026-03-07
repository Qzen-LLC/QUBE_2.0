"use client";

import React, { useState } from "react";
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

interface FinOpsReconciliationTabProps {
  finopsOutput: Record<string, unknown>;
  useCaseId: string;
}

export function FinOpsReconciliationTab({
  finopsOutput,
  useCaseId,
}: FinOpsReconciliationTabProps) {
  const [tagKey, setTagKey] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [tagSaving, setTagSaving] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagSaved, setTagSaved] = useState(false);

  // Extract projected costs from finopsOutput (uses architect engine output shape)
  const totalProjected = (finopsOutput?.summaryMonthlyMid ?? finopsOutput?.summary_monthly_mid) as number | undefined;
  const lineItems = (finopsOutput?.lineItems ?? finopsOutput?.line_items) as Record<string, unknown>[] | undefined;

  const projectedLines = (lineItems ?? []).map((item) => ({
    category: ((item.category as string) ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value: (item.monthlyCostMid ?? item.monthly_cost_mid) as number | undefined,
  })).filter(l => l.value != null && l.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Projected</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{fmt(totalProjected)}</p>
        </Card>
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
      </div>

      {/* Projected Cost Breakdown */}
      {projectedLines.length > 0 && (
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-semibold dark:text-white mb-4">Projected Cost Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Projected (Monthly)</th>
                  <th className="pb-3 text-right">Actual</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectedLines.map((line, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-3 dark:text-white font-medium">{line.category}</td>
                    <td className="py-3 text-right text-gray-500">{fmt(line.value)}</td>
                    <td className="py-3 text-right text-gray-400 dark:text-gray-500 italic">Pending</td>
                    <td className="py-3 text-right">
                      <span className="text-xs text-gray-400">awaiting data</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MCP Connection Banner */}
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
              <p>Once connected, this tab will automatically reconcile projected vs. actual costs.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Allocation Tag Configuration — pre-configure before MCP */}
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
              Pre-configure your cost allocation tag so reconciliation works automatically once MCP is connected.
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
