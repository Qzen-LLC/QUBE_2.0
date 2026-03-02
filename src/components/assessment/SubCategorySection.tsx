'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AssessmentQuestion, type AssessmentQuestionData, type AssessmentAnswerData } from './AssessmentQuestion';
import { FinOpsQuestion, type FinOpsAnswerData } from './FinOpsQuestion';

interface SubCategorySectionProps {
  subCategory: string;
  questions: AssessmentQuestionData[];
  answers: Record<string, AssessmentAnswerData | FinOpsAnswerData>;
  onAnswerChange: (questionId: string, answer: AssessmentAnswerData | FinOpsAnswerData) => void;
  readOnly?: boolean;
  isFinOps?: boolean;
  defaultOpen?: boolean;
}

export function SubCategorySection({
  subCategory,
  questions,
  answers,
  onAnswerChange,
  readOnly = false,
  isFinOps = false,
  defaultOpen = false,
}: SubCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const answeredCount = questions.filter((q) => {
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

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {subCategory}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {answeredCount}/{questions.length} answered
          </span>
          {avgScore && (
            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              Avg: {avgScore}/5
            </span>
          )}
        </div>
      </button>

      {/* Questions */}
      {isOpen && (
        <div className="p-4 space-y-4">
          {questions.map((question) =>
            isFinOps ? (
              <FinOpsQuestion
                key={question.id}
                question={question}
                answer={
                  (answers[question.id] as FinOpsAnswerData) || {
                    response: '',
                    score: null,
                    priority: null,
                    notes: '',
                    ownerAction: '',
                    costType: null,
                    estMonthlyCost: null,
                    estOneTimeCost: null,
                  }
                }
                onChange={(a) => onAnswerChange(question.id, a)}
                readOnly={readOnly}
              />
            ) : (
              <AssessmentQuestion
                key={question.id}
                question={question}
                answer={
                  (answers[question.id] as AssessmentAnswerData) || {
                    response: '',
                    score: null,
                    priority: null,
                    notes: '',
                    ownerAction: '',
                  }
                }
                onChange={(a) => onAnswerChange(question.id, a)}
                readOnly={readOnly}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
