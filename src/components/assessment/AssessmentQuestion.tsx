'use client';

import { useState } from 'react';
import { TierBadge } from './TierBadge';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface AssessmentQuestionData {
  id: string;
  text: string;
  questionNumber: number | null;
  aiAutomationTier: number | null;
  aiAgentGuidance: string | null;
  subCategory: string | null;
  stage: string;
  type: string;
  options?: QuestionOption[];
}

export interface AssessmentAnswerData {
  response: string;
  score: number | null;
  priority: string | null;
  notes: string;
  ownerAction: string;
}

interface AssessmentQuestionProps {
  question: AssessmentQuestionData;
  answer: AssessmentAnswerData;
  onChange: (answer: AssessmentAnswerData) => void;
  readOnly?: boolean;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

function RadioInput({ question, value, onChange, readOnly }: {
  question: AssessmentQuestionData;
  value: string;
  onChange: (val: string) => void;
  readOnly: boolean;
}) {
  const options = question.options || [];
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md border transition-colors cursor-pointer ${
            value === opt.text
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name={`q-${question.id}`}
            value={opt.text}
            checked={value === opt.text}
            onChange={() => onChange(opt.text)}
            disabled={readOnly}
            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-900 dark:text-gray-100">{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxInput({ question, value, onChange, readOnly }: {
  question: AssessmentQuestionData;
  value: string;
  onChange: (val: string) => void;
  readOnly: boolean;
}) {
  const options = question.options || [];
  const selected: string[] = value ? value.split('|||').filter(Boolean) : [];

  const toggle = (optText: string) => {
    const next = selected.includes(optText)
      ? selected.filter(s => s !== optText)
      : [...selected, optText];
    onChange(next.join('|||'));
  };

  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md border transition-colors cursor-pointer ${
            selected.includes(opt.text)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.text)}
            onChange={() => toggle(opt.text)}
            disabled={readOnly}
            className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-900 dark:text-gray-100">{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

function SliderInput({ question, value, onChange, readOnly }: {
  question: AssessmentQuestionData;
  value: string;
  onChange: (val: string) => void;
  readOnly: boolean;
}) {
  const options = question.options || [];
  const numericValue = parseInt(value) || 1;
  const max = options.length || 5;

  const currentLabel = options[numericValue - 1]?.text || `${numericValue}`;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min={1}
        max={max}
        value={numericValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {options.map((opt, i) => (
          <span
            key={opt.id}
            className={`${i + 1 === numericValue ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
          >
            {opt.text}
          </span>
        ))}
      </div>
      <div className="text-center text-sm font-medium text-blue-600 dark:text-blue-400">
        {currentLabel}
      </div>
    </div>
  );
}

export function AssessmentQuestion({ question, answer, onChange, readOnly = false }: AssessmentQuestionProps) {
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const updateField = (field: keyof AssessmentAnswerData, value: any) => {
    onChange({ ...answer, [field]: value });
  };

  const renderResponseInput = () => {
    switch (question.type) {
      case 'RADIO':
        return (
          <RadioInput
            question={question}
            value={answer.response}
            onChange={(val) => updateField('response', val)}
            readOnly={readOnly}
          />
        );
      case 'CHECKBOX':
        return (
          <CheckboxInput
            question={question}
            value={answer.response}
            onChange={(val) => updateField('response', val)}
            readOnly={readOnly}
          />
        );
      case 'SLIDER':
        return (
          <SliderInput
            question={question}
            value={answer.response}
            onChange={(val) => updateField('response', val)}
            readOnly={readOnly}
          />
        );
      case 'TEXT_MINI':
        return (
          <input
            type="text"
            value={answer.response}
            onChange={(e) => updateField('response', e.target.value)}
            disabled={readOnly}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your response..."
          />
        );
      default: // TEXT
        return (
          <textarea
            value={answer.response}
            onChange={(e) => updateField('response', e.target.value)}
            disabled={readOnly}
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
            placeholder="Enter your response..."
          />
        );
    }
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
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {question.text}
            </span>
          </div>
        </div>
        <TierBadge tier={question.aiAutomationTier} />
      </div>

      {/* AI Agent Guidance (collapsible) */}
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
        {renderResponseInput()}
      </div>

      {/* Score + Priority row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Score 1-5 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Score</label>
          <div className="flex gap-1">
            {SCORE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={readOnly}
                onClick={() => updateField('score', answer.score === s ? null : s)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  answer.score === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
          <div className="flex gap-1">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={readOnly}
                onClick={() => updateField('priority', answer.priority === p ? null : p)}
                className={`px-3 h-8 rounded text-xs font-medium transition-colors ${
                  answer.priority === p
                    ? p === 'High' ? 'bg-red-600 text-white'
                    : p === 'Medium' ? 'bg-yellow-500 text-white'
                    : 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes/Evidence + Owner/Action row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes / Evidence</label>
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
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Owner / Action</label>
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
