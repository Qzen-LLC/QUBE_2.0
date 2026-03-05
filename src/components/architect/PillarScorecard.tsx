"use client";

import React from "react";

const SCORE_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  green: { bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-700", text: "text-emerald-700 dark:text-emerald-400", label: "Green" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-700", text: "text-amber-700 dark:text-amber-400", label: "Amber" },
  red: { bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-700", text: "text-red-700 dark:text-red-400", label: "Red" },
  blocker: { bg: "bg-gray-100 dark:bg-gray-800", border: "border-red-300 dark:border-red-500", text: "text-red-600 dark:text-red-300", label: "Blocker" },
};

const PILLARS = [
  { key: "technical", name: "Technical" },
  { key: "business", name: "Business" },
  { key: "responsible", name: "Responsible" },
  { key: "legal", name: "Legal" },
  { key: "data_readiness", name: "Data Readiness" },
];

interface PillarScorecardProps {
  scores: Record<string, unknown>;
}

export function PillarScorecard({ scores }: PillarScorecardProps) {
  if (!scores) return null;

  const pillarScores = (scores as Record<string, Record<string, string>>);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Pillar Readiness Scorecard
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {PILLARS.map((p) => {
          const data = pillarScores[p.key] ?? {};
          const score = data.score ?? "amber";
          const style = SCORE_STYLES[score] ?? SCORE_STYLES.amber;

          return (
            <div
              key={p.key}
              className={`${style.bg} border ${style.border} rounded-lg p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {p.name}
                </span>
              </div>
              <div className={`text-lg font-bold ${style.text}`}>
                {style.label}
              </div>
              {data.reason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">
                  {data.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Conflicts */}
      {Array.isArray(scores.conflicts) && scores.conflicts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
            Cross-Pillar Conflicts Detected
          </h4>
          <ul className="space-y-1">
            {(scores.conflicts as string[]).map((c, i) => (
              <li key={i} className="text-sm text-amber-600 dark:text-amber-200/80">
                &bull; {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Follow-up Questions */}
      {Array.isArray(scores.follow_up_questions) &&
        scores.follow_up_questions.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Recommended Follow-up Questions
            </h4>
            <ul className="space-y-2">
              {(scores.follow_up_questions as Record<string, string>[]).map(
                (q, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-blue-600 dark:text-blue-300">
                      [{q.pillar}]
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-200">
                      {q.question}
                    </span>
                    {q.why_it_matters && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Impact: {q.why_it_matters}
                      </p>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {/* Blockers */}
      {Array.isArray(scores.blockers) && scores.blockers.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
            Blockers
          </h4>
          <ul className="space-y-1">
            {(scores.blockers as string[]).map((b, i) => (
              <li key={i} className="text-sm text-red-600 dark:text-red-200/80">
                &bull; {b}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
