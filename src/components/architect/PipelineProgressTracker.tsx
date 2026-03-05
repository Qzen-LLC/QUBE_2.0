"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { PipelineStep } from "@/hooks/useArchitectPipeline";

const STEPS: { id: PipelineStep; label: string }[] = [
  { id: "scoring_pillars", label: "Scoring Pillars" },
  { id: "matching_archetype", label: "Matching Archetype" },
  { id: "enriching_context", label: "Enriching Context" },
  { id: "generating_finops", label: "Generating FinOps" },
  { id: "generating_risks", label: "Generating Risks" },
  { id: "generating_threats", label: "Generating Threats" },
  { id: "generating_guardrails", label: "Generating Guardrails" },
  { id: "generating_summary", label: "Executive Summary" },
];

interface PipelineProgressTrackerProps {
  currentStep: PipelineStep;
  error?: string | null;
}

export function PipelineProgressTracker({
  currentStep,
  error,
}: PipelineProgressTrackerProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
      <h3 className="text-lg font-semibold dark:text-white mb-4">
        Generating Architecture Assessment
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isActive = step.id === currentStep;
          const isComplete = currentIdx > i || currentStep === "completed";
          const isPending = currentIdx < i && currentStep !== "completed";

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isComplete
                    ? "bg-green-500 text-white"
                    : isActive
                      ? "bg-blue-500 text-white animate-pulse"
                      : isPending
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-500"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {isComplete ? "\u2713" : i + 1}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : isComplete
                      ? "text-gray-500 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
