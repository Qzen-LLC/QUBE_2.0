'use client';

import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AssessmentQuestionData } from './AssessmentQuestion';

export interface FinOpsAnswerData {
  response: string;
  score: number | null;
  priority: string | null;
  notes: string;
  ownerAction: string;
  costType: string | null;
  estMonthlyCost: number | null;
  estOneTimeCost: number | null;
}

interface FinOpsQuestionProps {
  question: AssessmentQuestionData;
  answer: FinOpsAnswerData;
  onChange: (answer: FinOpsAnswerData) => void;
  readOnly?: boolean;
}

const COST_TYPE_OPTIONS = ['Monthly Recurring', 'One-Time', 'Variable', 'Annual'];

export function FinOpsQuestion({ question, answer, onChange, readOnly = false }: FinOpsQuestionProps) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const updateField = (field: keyof FinOpsAnswerData, value: any) => {
    onChange({ ...answer, [field]: value });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {question.questionNumber && (
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                #{question.questionNumber}
              </span>
            )}
            {question.subCategory && (
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {question.subCategory}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 block">
            {question.text}
          </span>
        </div>
        <TierBadge tier={question.aiAutomationTier} />
      </div>

      {/* AI Agent Guidance */}
      {question.aiAgentGuidance && (
        <div>
          <button
            type="button"
            onClick={() => setGuidanceOpen(!guidanceOpen)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {guidanceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            AI Guidance
          </button>
          {guidanceOpen && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
              {question.aiAgentGuidance}
            </p>
          )}
        </div>
      )}

      {/* Response */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Response</label>
        <textarea
          value={answer.response}
          onChange={(e) => updateField('response', e.target.value)}
          disabled={readOnly}
          rows={2}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
          placeholder="Enter your response..."
        />
      </div>

      {/* Cost-specific fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Cost Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Cost Type</label>
          <select
            value={answer.costType || ''}
            onChange={(e) => updateField('costType', e.target.value || null)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select type...</option>
            {COST_TYPE_OPTIONS.map((ct) => (
              <option key={ct} value={ct}>{ct}</option>
            ))}
          </select>
        </div>

        {/* Est. Monthly Cost */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Est. Monthly $</label>
          <input
            type="number"
            value={answer.estMonthlyCost ?? ''}
            onChange={(e) => updateField('estMonthlyCost', e.target.value ? Number(e.target.value) : null)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Est. One-Time Cost */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Est. One-Time $</label>
          <input
            type="number"
            value={answer.estOneTimeCost ?? ''}
            onChange={(e) => updateField('estOneTimeCost', e.target.value ? Number(e.target.value) : null)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Notes + Owner row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes / Assumptions</label>
          <input
            type="text"
            value={answer.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Supporting notes..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Owner</label>
          <input
            type="text"
            value={answer.ownerAction}
            onChange={(e) => updateField('ownerAction', e.target.value)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Assigned owner..."
          />
        </div>
      </div>
    </div>
  );
}
