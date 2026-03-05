"use client";

import React, { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  passing: { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
  degraded: { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
  failing: { bg: "bg-red-50 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800" },
  unknown: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" },
};

interface EvalsMonitoringTabProps {
  guardrailsOutput: Record<string, unknown>;
  useCaseId: string;
}

export function EvalsMonitoringTab({
  guardrailsOutput,
  useCaseId,
}: EvalsMonitoringTabProps) {
  const [registered, setRegistered] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<Record<string, unknown> | null>(null);
  const [evalStatus, setEvalStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = useCaseId || "default";

  const handleRegister = useCallback(async () => {
    if (!guardrailsOutput) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/production/evals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          guardrailsOutput,
          platform: "langfuse",
        }),
      });
      if (!res.ok) throw new Error("Registration failed");
      const result = await res.json();
      setRegistrationResult(result);
      setRegistered(true);
      // Fetch status
      const statusRes = await fetch(`/api/production/evals/status/${projectId}`);
      if (statusRes.ok) setEvalStatus(await statusRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setLoading(false);
  }, [guardrailsOutput, projectId]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/production/evals/status/${projectId}`);
      if (res.ok) setEvalStatus(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [projectId]);

  if (!guardrailsOutput) {
    return (
      <Card className="p-6 dark:bg-gray-900">
        <p className="text-gray-500 text-sm">No guardrails output available for monitoring.</p>
      </Card>
    );
  }

  const guardrails = guardrailsOutput.guardrails as unknown[] | undefined;
  const evalMetrics = guardrailsOutput.evalMetrics as unknown[] | undefined;
  const guardrailResults = (evalStatus?.guardrailResults ?? evalStatus?.guardrail_results) as Record<string, unknown>[] | undefined;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Registration */}
      {!registered && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-base font-semibold dark:text-white mb-3">Register Guardrails for Monitoring</h3>
          <p className="text-sm text-gray-500 mb-4">
            Register your guardrail eval metrics with the connected evals platform to enable live monitoring.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm dark:text-gray-300">
              <strong>{guardrails?.length ?? 0}</strong> guardrails and{" "}
              <strong>{evalMetrics?.length ?? 0}</strong> eval metrics ready to register.
            </p>
          </div>
          <Button onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register & Start Monitoring"}
          </Button>
        </Card>
      )}

      {/* Registration Result */}
      {registrationResult && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold dark:text-white">Registration Status</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
              {registrationResult.registeredCount ?? registrationResult.registered_count} registered
            </span>
          </div>
        </Card>
      )}

      {/* Live Eval Status */}
      {evalStatus && guardrailResults && (
        <>
          {/* Health KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Health Score</p>
              <p className={`text-2xl font-bold mt-1 ${
                (evalStatus.overallHealthScore ?? evalStatus.overall_health_score as number) >= 90 ? "text-green-500" :
                (evalStatus.overallHealthScore ?? evalStatus.overall_health_score as number) >= 70 ? "text-amber-500" : "text-red-500"
              }`}>
                {evalStatus.overallHealthScore ?? evalStatus.overall_health_score}%
              </p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Metrics</p>
              <p className="text-2xl font-bold dark:text-white mt-1">{guardrailResults.length}</p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Degraded</p>
              <p className={`text-2xl font-bold mt-1 ${
                ((evalStatus.degradedGuardrails ?? evalStatus.degraded_guardrails) as string[])?.length > 0 ? "text-amber-500" : "text-green-500"
              }`}>
                {((evalStatus.degradedGuardrails ?? evalStatus.degraded_guardrails) as string[])?.length ?? 0}
              </p>
            </Card>
            <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Failing</p>
              <p className={`text-2xl font-bold mt-1 ${
                ((evalStatus.failingGuardrails ?? evalStatus.failing_guardrails) as string[])?.length > 0 ? "text-red-500" : "text-green-500"
              }`}>
                {((evalStatus.failingGuardrails ?? evalStatus.failing_guardrails) as string[])?.length ?? 0}
              </p>
            </Card>
          </div>

          {/* Alerts */}
          {(evalStatus.alerts as Record<string, unknown>[])?.length > 0 && (
            <Card className="p-4 dark:bg-gray-900 border-amber-200 dark:border-amber-800/50">
              <h3 className="text-base font-semibold text-amber-600 dark:text-amber-400 mb-3">Degradation Alerts</h3>
              <div className="space-y-2">
                {(evalStatus.alerts as Record<string, unknown>[]).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={a.level === "critical" ? "text-red-500" : "text-amber-500"}>!</span>
                    <span className="text-gray-700 dark:text-gray-300">{a.message as string}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pass Rate Bars */}
          <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-base font-semibold dark:text-white mb-4">Guardrail Pass Rates</h3>
            <div className="space-y-3">
              {guardrailResults.map((r, i) => {
                const status = (r.status as string) ?? "unknown";
                const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
                const passRate = (r.passRate ?? r.pass_rate) as number;
                const guardrailName = (r.guardrailName ?? r.guardrail_name) as string;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm dark:text-white font-medium">{guardrailName}</span>
                        <span className="text-xs text-gray-500">{r.layer as string}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>{status}</span>
                        <span className="text-sm font-mono text-gray-500">{passRate}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passRate >= 90 ? "bg-green-500" : passRate >= 70 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(passRate, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>{(r.sampleCount ?? r.sample_count) as number} samples</span>
                      {(r.targetValue ?? r.target_value) && (
                        <span>Target: {(r.targetValue ?? r.target_value) as string}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={fetchStatus}>Refresh Status</Button>
          </div>
        </>
      )}
    </div>
  );
}
