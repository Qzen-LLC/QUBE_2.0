'use client';

import { useMemo } from 'react';
import { SubCategorySection } from './SubCategorySection';
import type { AssessmentQuestionData, AssessmentAnswerData } from './AssessmentQuestion';
import type { FinOpsAnswerData } from './FinOpsQuestion';

interface PillarAssessmentProps {
  stage: string;
  pillarLabel: string;
  guidingQuestion: string;
  questions: AssessmentQuestionData[];
  answers: Record<string, AssessmentAnswerData | FinOpsAnswerData>;
  onAnswerChange: (questionId: string, answer: AssessmentAnswerData | FinOpsAnswerData) => void;
  readOnly?: boolean;
  isFinOps?: boolean;
}

export function PillarAssessment({
  pillarLabel,
  guidingQuestion,
  questions,
  answers,
  onAnswerChange,
  readOnly = false,
  isFinOps = false,
}: PillarAssessmentProps) {
  // Group questions by subCategory
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, AssessmentQuestionData[]> = {};
    for (const q of questions) {
      const cat = q.subCategory || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(q);
    }
    // Sort questions within each group by questionNumber
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));
    }
    return groups;
  }, [questions]);

  const subCategories = Object.keys(groupedQuestions);

  // Overall stats
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter((q) => {
    const a = answers[q.id];
    return a && (a.response?.trim() || a.score);
  }).length;

  const avgScore = (() => {
    const scores = questions
      .map((q) => answers[q.id]?.score)
      .filter((s): s is number => s != null);
    if (scores.length === 0) return null;
    return (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1);
  })();

  // Tier distribution
  const tierCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const q of questions) {
      if (q.aiAutomationTier && q.aiAutomationTier in counts) {
        counts[q.aiAutomationTier as 1 | 2 | 3]++;
      }
    }
    return counts;
  }, [questions]);

  return (
    <div className="space-y-4">
      {/* Pillar header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pillarLabel}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">{guidingQuestion}</p>

        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Progress: <strong>{answeredQuestions}/{totalQuestions}</strong>
          </span>
          {avgScore && (
            <span className="text-gray-600 dark:text-gray-400">
              Avg Score: <strong>{avgScore}/5</strong>
            </span>
          )}
          <span className="text-green-600 dark:text-green-400" title="AI Fully Automates">
            T1: {tierCounts[1]}
          </span>
          <span className="text-blue-600 dark:text-blue-400" title="AI Drafts, Human Validates">
            T2: {tierCounts[2]}
          </span>
          <span className="text-orange-600 dark:text-orange-400" title="Human Must Answer">
            T3: {tierCounts[3]}
          </span>
        </div>
      </div>

      {/* Sub-category sections */}
      {subCategories.map((cat, index) => (
        <SubCategorySection
          key={cat}
          subCategory={cat}
          questions={groupedQuestions[cat]}
          answers={answers}
          onAnswerChange={onAnswerChange}
          readOnly={readOnly}
          isFinOps={isFinOps}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}
