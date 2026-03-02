'use client';

import type { AssessmentQuestionData, AssessmentAnswerData } from './AssessmentQuestion';
import type { FinOpsAnswerData } from './FinOpsQuestion';

interface PillarSummary {
  id: number;
  label: string;
  guidingQuestion: string;
  stage: string;
  totalQuestions: number;
  answeredQuestions: number;
  avgScore: number | null;
  tierCounts: { 1: number; 2: number; 3: number };
  reviewStatus: string;
}

interface PillarOverviewProps {
  useCase: any;
  allQuestions: AssessmentQuestionData[];
  allAnswers: Record<string, AssessmentAnswerData | FinOpsAnswerData>;
}

const PILLARS = [
  { id: 0, label: 'Requirements', stage: 'REQUIREMENTS', guidingQuestion: 'What should the system do?', reviewField: 'requirementsReviewStatus' },
  { id: 1, label: 'Technical', stage: 'TECHNICAL', guidingQuestion: 'Can we build it?', reviewField: 'technicalReviewStatus' },
  { id: 2, label: 'Business', stage: 'BUSINESS', guidingQuestion: 'Should we build it?', reviewField: 'businessReviewStatus' },
  { id: 3, label: 'Responsible / Ethical', stage: 'RESPONSIBLE_ETHICAL', guidingQuestion: 'Is it the right thing to do?', reviewField: 'responsibleEthicalReviewStatus' },
  { id: 4, label: 'Legal & Regulatory', stage: 'LEGAL_REGULATORY', guidingQuestion: 'Are we allowed to do it?', reviewField: 'legalRegulatoryReviewStatus' },
  { id: 5, label: 'Data Readiness', stage: 'DATA_READINESS', guidingQuestion: 'Do we have the right data?', reviewField: 'dataReadinessReviewStatus' },
  { id: 6, label: 'FinOps Assessment', stage: 'FINOPS', guidingQuestion: 'What will it cost?', reviewField: 'finopsReviewStatus' },
];

export function PillarOverview({ useCase, allQuestions, allAnswers }: PillarOverviewProps) {
  const pillarSummaries: PillarSummary[] = PILLARS.map((p) => {
    const questions = allQuestions.filter((q) => q.stage === p.stage);
    const answeredQuestions = questions.filter((q) => {
      const a = allAnswers[q.id];
      const hasResponse = typeof a?.response === 'string' ? a.response.trim() : !!a?.response;
      return a && (hasResponse || a.score);
    }).length;
    const scores = questions
      .map((q) => allAnswers[q.id]?.score)
      .filter((s): s is number => s != null);
    const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;
    const tierCounts = { 1: 0, 2: 0, 3: 0 };
    for (const q of questions) {
      if (q.aiAutomationTier && q.aiAutomationTier in tierCounts) {
        tierCounts[q.aiAutomationTier as 1 | 2 | 3]++;
      }
    }

    return {
      ...p,
      totalQuestions: questions.length,
      answeredQuestions,
      avgScore,
      tierCounts,
      reviewStatus: useCase?.[p.reviewField] || 'NOT_READY_FOR_REVIEW',
    };
  });

  // FinOps summary
  const finopsQuestions = allQuestions.filter((q) => q.stage === 'FINOPS');
  const totalMonthlyCost = finopsQuestions.reduce((sum, q) => {
    const a = allAnswers[q.id] as FinOpsAnswerData | undefined;
    return sum + (a?.estMonthlyCost || 0);
  }, 0);
  const totalOneTimeCost = finopsQuestions.reduce((sum, q) => {
    const a = allAnswers[q.id] as FinOpsAnswerData | undefined;
    return sum + (a?.estOneTimeCost || 0);
  }, 0);

  const totalAnswered = pillarSummaries.reduce((s, p) => s + p.answeredQuestions, 0);
  const totalQuestions = pillarSummaries.reduce((s, p) => s + p.totalQuestions, 0);

  return (
    <div className="space-y-6">
      {/* Use Case Info */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Overview & Decision Gate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-xs">Use Case</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{useCase?.title || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-xs">AI Type</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{useCase?.aiType || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-xs">Executive Sponsor</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{useCase?.executiveSponsor || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block text-xs">Overall Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {totalAnswered}/{totalQuestions} ({totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Pillar Summary Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">#</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Pillar</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Guiding Question</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Progress</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Avg Score</th>
                <th className="text-center px-4 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {pillarSummaries.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{p.id}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{p.label}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 italic text-xs">{p.guidingQuestion}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${p.totalQuestions > 0 ? (p.answeredQuestions / p.totalQuestions) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {p.answeredQuestions}/{p.totalQuestions}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {p.avgScore != null ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {p.avgScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.reviewStatus === 'READY_FOR_REVIEW'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {p.reviewStatus === 'READY_FOR_REVIEW' ? 'Ready' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FinOps Summary */}
      {(totalMonthlyCost > 0 || totalOneTimeCost > 0) && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">FinOps Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Est. Monthly Run Cost</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                ${totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Est. One-Time Build Cost</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                ${totalOneTimeCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block text-xs">Est. Annual Cost</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                ${(totalMonthlyCost * 12 + totalOneTimeCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
