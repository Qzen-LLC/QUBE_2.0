"use client";

import React from "react";

export interface PipelineStage {
  id: string;
  label: string;
  status: "pending" | "running" | "completed" | "error" | "skipped";
  duration?: number;
  error?: string;
  counts?: Record<string, number>;
}

interface PipelineProgressProps {
  stages: PipelineStage[];
  totalDuration?: number;
  onClose?: () => void;
}

const STAGE_ORDER: { id: string; label: string }[] = [
  { id: "expansion", label: "Expanding assessment" },
  { id: "risks", label: "Generating risks" },
  { id: "threats", label: "Generating threats" },
  { id: "finops", label: "Generating FinOps insights" },
  { id: "guardrails", label: "Generating guardrails" },
  { id: "evaluations", label: "Generating evaluations" },
];

function StatusIcon({ status }: { status: PipelineStage["status"] }) {
  switch (status) {
    case "completed":
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "running":
      return (
        <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      );
    case "error":
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case "skipped":
      return (
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      );
    default: // pending
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

function formatCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([key, val]) => {
      const label = key.replace(/([A-Z])/g, " $1").toLowerCase();
      return `${val} ${label}`;
    })
    .join(", ");
}

export function PipelineProgress({ stages, totalDuration, onClose }: PipelineProgressProps) {
  // Merge provided stages with the default stage list
  const displayStages = STAGE_ORDER.map((def) => {
    const found = stages.find((s) => s.id === def.id);
    return {
      id: def.id,
      label: found?.label || def.label,
      status: found?.status || ("pending" as const),
      duration: found?.duration,
      error: found?.error,
      counts: found?.counts,
    };
  });

  const isRunning = displayStages.some((s) => s.status === "running");
  const completedCount = displayStages.filter((s) => s.status === "completed").length;
  const errorCount = displayStages.filter((s) => s.status === "error").length;
  const isDone = !isRunning && displayStages.every((s) => s.status !== "pending");

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-purple-800 dark:text-purple-300">
            Assessment Pipeline
          </h3>
          {isRunning && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 animate-pulse">
              Running
            </span>
          )}
          {isDone && errorCount === 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
              Complete
            </span>
          )}
          {isDone && errorCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">
              {completedCount} of {displayStages.length - displayStages.filter(s => s.status === 'skipped').length} completed
            </span>
          )}
        </div>
        {isDone && totalDuration && (
          <span className="text-xs text-purple-500 dark:text-purple-400">
            Total: {formatDuration(totalDuration)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {displayStages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3">
            <StatusIcon status={stage.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    stage.status === "running"
                      ? "text-blue-700 dark:text-blue-300 font-medium"
                      : stage.status === "completed"
                      ? "text-green-700 dark:text-green-300"
                      : stage.status === "error"
                      ? "text-red-600 dark:text-red-400"
                      : stage.status === "skipped"
                      ? "text-gray-400 dark:text-gray-500 line-through"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stage.label}
                </span>
                {stage.duration && stage.status !== "pending" && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDuration(stage.duration)}
                  </span>
                )}
                {stage.counts && stage.status === "completed" && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({formatCounts(stage.counts)})
                  </span>
                )}
              </div>
              {stage.status === "error" && stage.error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 truncate">
                  {stage.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
