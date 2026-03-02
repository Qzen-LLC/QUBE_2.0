"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import FinancialDashboard from './financial-dashboard/page';
import AIRiskIntelligence from '@/components/AIRiskIntelligence';
import SecurityAssessment from '@/components/SecurityAssessment';
import ReadOnlyAIRiskIntelligence from '@/components/ReadOnlyAIRiskIntelligence';
import ReadOnlySecurityAssessment from '@/components/ReadOnlySecurityAssessment';
import GuardrailsGenerator from '@/components/guardrails/GuardrailsGenerator';
import EvaluationGenerator from '@/components/evaluations/EvaluationGenerator';
import GoldenDatasetDashboard from '@/components/golden/GoldenDatasetDashboard';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Stage } from '@/generated/prisma';
import { useUserData } from '@/contexts/UserContext';
import { PillarAssessment } from '@/components/assessment/PillarAssessment';
import { PillarOverview } from '@/components/assessment/PillarOverview';
import { PipelineProgress, type PipelineStage } from '@/components/assessment/PipelineProgress';
import type { AssessmentQuestionData, AssessmentAnswerData } from '@/components/assessment/AssessmentQuestion';
import type { FinOpsAnswerData } from '@/components/assessment/FinOpsQuestion';

interface UseCase {
  title: string;
  department: string;
  owner: string;
  aiucId: number;
  stage: string;
  organizationId?: string;
  problemStatement?: string;
  proposedAISolution?: string;
  aiType?: string | null;
  executiveSponsor?: string | null;
  requirementsReviewStatus?: string | null;
  technicalReviewStatus?: string | null;
  businessReviewStatus?: string | null;
  responsibleEthicalReviewStatus?: string | null;
  legalRegulatoryReviewStatus?: string | null;
  dataReadinessReviewStatus?: string | null;
  finopsReviewStatus?: string | null;
}

// Pillar configuration
const PILLAR_CONFIG = [
  { id: 0, title: 'Overview', stage: null, label: 'Overview & Decision Gate', guidingQuestion: '', reviewField: null },
  { id: 1, title: 'Requirements', stage: 'REQUIREMENTS' as const, label: 'Pillar 0: Requirements', guidingQuestion: 'What should the system do?', reviewField: 'requirementsReviewStatus' },
  { id: 2, title: 'Technical', stage: 'TECHNICAL' as const, label: 'Pillar 1: Technical', guidingQuestion: 'Can we build it?', reviewField: 'technicalReviewStatus' },
  { id: 3, title: 'Business', stage: 'BUSINESS' as const, label: 'Pillar 2: Business', guidingQuestion: 'Should we build it?', reviewField: 'businessReviewStatus' },
  { id: 4, title: 'Responsible / Ethical', stage: 'RESPONSIBLE_ETHICAL' as const, label: 'Pillar 3: Responsible / Ethical', guidingQuestion: 'Is it the right thing to do?', reviewField: 'responsibleEthicalReviewStatus' },
  { id: 5, title: 'Legal & Regulatory', stage: 'LEGAL_REGULATORY' as const, label: 'Pillar 4: Legal & Regulatory', guidingQuestion: 'Are we allowed to do it?', reviewField: 'legalRegulatoryReviewStatus' },
  { id: 6, title: 'Data Readiness', stage: 'DATA_READINESS' as const, label: 'Pillar 5: Data Readiness', guidingQuestion: 'Do we have the right data?', reviewField: 'dataReadinessReviewStatus' },
  { id: 7, title: 'FinOps', stage: 'FINOPS' as const, label: 'Pillar 6: FinOps Assessment', guidingQuestion: 'What will it cost?', reviewField: 'finopsReviewStatus' },
  { id: 8, title: 'Risk Modeling', stage: null, label: 'Risk Modeling', guidingQuestion: '', reviewField: null },
  { id: 9, title: 'Threat Modeling', stage: null, label: 'Threat Modeling', guidingQuestion: '', reviewField: null },
  { id: 10, title: 'AI Guardrails', stage: null, label: 'AI Guardrails', guidingQuestion: '', reviewField: null },
  { id: 11, title: 'AI Evaluations', stage: null, label: 'AI Evaluations', guidingQuestion: '', reviewField: null },
  { id: 12, title: 'Golden Dataset', stage: null, label: 'Golden Dataset', guidingQuestion: '', reviewField: null },
];

export default function AssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const useCaseId = params.useCaseId as string;

  const stepParam = searchParams.get('step');
  const readonlyParam = searchParams.get('readonly');

  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState<'full' | 'quick' | 'core'>('full');
  const pageTopRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Questions and answers state
  const [allQuestions, setAllQuestions] = useState<AssessmentQuestionData[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswerData | FinOpsAnswerData>>({});
  const questionsFetchedRef = useRef<string | null>(null);

  // Auto-save timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef(false);

  // Pipeline state (for Core+Expand mode)
  const [expanding, setExpanding] = useState(false);
  const [expansionStatus, setExpansionStatus] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [pipelineTotalDuration, setPipelineTotalDuration] = useState<number | undefined>();
  const [showPipeline, setShowPipeline] = useState(false);

  const { userData } = useUserData();

  // Current pillar config
  const currentPillar = PILLAR_CONFIG[currentStep] || PILLAR_CONFIG[0];

  const canEdit = useMemo(() => {
    if (readonlyParam === 'true') return false;
    // Overview is read-only
    if (currentStep === 0) return false;
    // All other steps are editable
    return true;
  }, [readonlyParam, currentStep]);

  const isReadOnly = !canEdit;

  // Fetch use case details
  useEffect(() => {
    if (!useCaseId) return;
    setLoading(true);
    fetch(`/api/get-usecase-details?useCaseId=${useCaseId}&acquireSharedLock=true`)
      .then(res => res.json())
      .then(data => {
        if (data.useCase) {
          setUseCase(data.useCase);
        } else if (data.title) {
          setUseCase(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading use case:', err);
        setError('Failed to load use case');
        setLoading(false);
      });
  }, [useCaseId]);

  // Fetch questions (re-fetches when assessmentMode changes)
  useEffect(() => {
    const fetchKey = `${useCaseId}-${assessmentMode}`;
    if (!useCaseId || questionsFetchedRef.current === fetchKey) return;
    questionsFetchedRef.current = fetchKey;
    setQuestionsLoading(true);

    const modeParam = assessmentMode === 'quick' ? '&mode=quick' : assessmentMode === 'core' ? '&mode=core' : '';
    fetch(`/api/get-assess-questions?useCaseId=${useCaseId}${modeParam}`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : [];
        // Map to AssessmentQuestionData
        const mapped: AssessmentQuestionData[] = items.map(q => ({
          id: q.id,
          text: q.text,
          questionNumber: q.questionNumber,
          aiAutomationTier: q.aiAutomationTier,
          aiAgentGuidance: q.aiAgentGuidance,
          subCategory: q.subCategory,
          stage: q.stage,
          type: q.type,
          options: q.options,
        }));
        setAllQuestions(mapped);

        // Build answers map
        const answersMap: Record<string, AssessmentAnswerData | FinOpsAnswerData> = {};
        for (const q of items) {
          const responseText = q.answers?.[0]?.value || '';
          const isFinOps = q.stage === 'FINOPS';

          if (isFinOps) {
            answersMap[q.id] = {
              response: responseText,
              score: q.score ?? null,
              priority: q.priority ?? null,
              notes: q.notes ?? '',
              ownerAction: q.ownerAction ?? '',
              costType: q.costType ?? null,
              estMonthlyCost: q.estMonthlyCost ?? null,
              estOneTimeCost: q.estOneTimeCost ?? null,
            };
          } else {
            answersMap[q.id] = {
              response: responseText,
              score: q.score ?? null,
              priority: q.priority ?? null,
              notes: q.notes ?? '',
              ownerAction: q.ownerAction ?? '',
            };
          }
        }
        setAnswers(answersMap);
        setQuestionsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching questions:', err);
        setQuestionsLoading(false);
      });
  }, [useCaseId, assessmentMode]);

  // Questions for current pillar
  const currentQuestions = useMemo(() => {
    if (!currentPillar.stage) return [];
    return allQuestions.filter(q => q.stage === currentPillar.stage);
  }, [allQuestions, currentPillar.stage]);

  // Handle answer change with debounced auto-save
  const handleAnswerChange = useCallback((questionId: string, answer: AssessmentAnswerData | FinOpsAnswerData) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    pendingSaveRef.current = true;

    // Debounce auto-save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        handleSave();
      }
    }, 3000);
  }, []);

  // Save answers
  const handleSave = useCallback(async () => {
    if (!useCaseId) return;
    pendingSaveRef.current = false;
    setSaving(true);

    try {
      // Build the answers payload
      const answersPayload: Record<string, any[]> = {};

      for (const [questionId, answer] of Object.entries(answers)) {
        if (answer.response?.trim() || answer.score || answer.priority || answer.notes?.trim() || answer.ownerAction?.trim()) {
          answersPayload[questionId] = [{
            value: answer.response || '',
            score: answer.score,
            priority: answer.priority,
            notes: answer.notes,
            ownerAction: answer.ownerAction,
            ...('costType' in answer ? {
              costType: answer.costType,
              estMonthlyCost: answer.estMonthlyCost,
              estOneTimeCost: answer.estOneTimeCost,
            } : {}),
          }];
        }
      }

      await fetch('/api/save-question-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, answers: answersPayload }),
      });

      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving:', err);
      setSaving(false);
    }
  }, [useCaseId, answers]);

  // Review status toggle
  const handleReviewStatusToggle = useCallback(async (checked: boolean) => {
    if (!useCaseId || !currentPillar.reviewField) return;

    const pillarStageIndex = currentStep - 1; // Map tab index to stage number (0-6)
    const status = checked ? 'READY_FOR_REVIEW' : 'NOT_READY_FOR_REVIEW';

    try {
      const res = await fetch('/api/update-review-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, stage: pillarStageIndex, status }),
      });
      const data = await res.json();
      if (data.success && data.useCase) {
        setUseCase(prev => prev ? { ...prev, [currentPillar.reviewField!]: status } : prev);
      }
    } catch (err) {
      console.error('Error updating review status:', err);
    }
  }, [useCaseId, currentStep, currentPillar.reviewField]);

  // Update URL when step changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(currentStep));
    window.history.replaceState({}, '', url.toString());
  }, [currentStep]);

  // Scroll navigation to keep current step visible
  useEffect(() => {
    if (navigationRef.current) {
      const activeBtn = navigationRef.current.querySelector(`[data-step="${currentStep}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep]);

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const currentReviewStatus = currentPillar.reviewField
    ? (useCase as any)?.[currentPillar.reviewField] || 'NOT_READY_FOR_REVIEW'
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500 dark:text-gray-400">Loading assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div ref={pageTopRef} className="space-y-4">
      {/* Navigation tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
        <div ref={navigationRef} className="flex overflow-x-auto gap-1 scrollbar-hide">
          {PILLAR_CONFIG.map((pillar) => (
            <button
              key={pillar.id}
              data-step={pillar.id}
              onClick={() => setCurrentStep(pillar.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                currentStep === pillar.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {pillar.id <= 7 && pillar.id > 0 ? `${pillar.id - 1}. ` : ''}{pillar.title}
            </button>
          ))}
        </div>
      </div>

      {/* Header bar: assessment mode toggle, read-only indicator, review status, save button */}
      {currentStep >= 0 && currentStep <= 7 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Assessment mode toggle */}
            <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAssessmentMode('quick')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  assessmentMode === 'quick'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setAssessmentMode('core')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  assessmentMode === 'core'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Core + Expand
              </button>
              <button
                type="button"
                onClick={() => setAssessmentMode('full')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  assessmentMode === 'full'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Full
              </button>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {allQuestions.length} questions
            </span>
            {isReadOnly && currentStep >= 1 && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                Read Only
              </span>
            )}
            {currentStep >= 1 && currentReviewStatus && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={currentReviewStatus === 'READY_FOR_REVIEW'}
                  onCheckedChange={handleReviewStatusToggle}
                  disabled={isReadOnly}
                />
                <Label className="text-xs text-gray-500 dark:text-gray-400">
                  {currentReviewStatus === 'READY_FOR_REVIEW' ? 'Ready for Review' : 'Not Ready'}
                </Label>
              </div>
            )}
          </div>
          {currentStep >= 1 && (
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || isReadOnly}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="min-h-[60vh]">
        {questionsLoading && currentStep >= 0 && currentStep <= 7 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500 dark:text-gray-400">Loading questions...</div>
          </div>
        ) : currentStep === 0 ? (
          /* Overview tab */
          <PillarOverview
            useCase={useCase}
            allQuestions={allQuestions}
            allAnswers={answers}
          />
        ) : currentStep >= 1 && currentStep <= 7 ? (
          /* Pillar assessment tabs */
          <>
            <PillarAssessment
              stage={currentPillar.stage!}
              pillarLabel={currentPillar.label}
              guidingQuestion={currentPillar.guidingQuestion}
              questions={currentQuestions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              readOnly={isReadOnly}
              isFinOps={currentPillar.stage === 'FINOPS'}
            />
            {assessmentMode === 'core' && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-purple-800 dark:text-purple-300">
                        Core + Expand Mode
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                        Answer these ~25 core questions, then use AI to expand and auto-generate Risks, Threats, FinOps, Guardrails, and Evaluations.
                      </p>
                      {expansionStatus && !showPipeline && (
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1 font-medium">
                          {expansionStatus}
                        </p>
                      )}
                    </div>
                    <Button
                      disabled={expanding}
                      onClick={async () => {
                        setExpanding(true);
                        setShowPipeline(true);
                        setExpansionStatus(null);
                        setPipelineTotalDuration(undefined);

                        // Initialize pipeline stages as running/pending
                        const initialStages: PipelineStage[] = [
                          { id: 'expansion', label: 'Expanding assessment', status: 'running' },
                          { id: 'risks', label: 'Generating risks', status: 'pending' },
                          { id: 'threats', label: 'Generating threats', status: 'pending' },
                          { id: 'finops', label: 'Generating FinOps insights', status: 'pending' },
                          { id: 'guardrails', label: 'Generating guardrails', status: 'pending' },
                          { id: 'evaluations', label: 'Generating evaluations', status: 'pending' },
                        ];
                        setPipelineStages(initialStages);

                        try {
                          // Save answers before pipeline
                          await handleSave();

                          // Simulate progress updates during the long-running request
                          const progressTimer = setInterval(() => {
                            setPipelineStages(prev => {
                              // Find first pending stage after any running stage
                              const runningIdx = prev.findIndex(s => s.status === 'running');
                              if (runningIdx === -1) return prev;
                              return prev; // Don't auto-advance — the API response will set final state
                            });
                          }, 5000);

                          // Phase 1: expansion is running
                          setPipelineStages(prev => prev.map(s =>
                            s.id === 'expansion' ? { ...s, status: 'running' } : s
                          ));

                          const res = await fetch('/api/assessment-pipeline', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ useCaseId }),
                          });

                          clearInterval(progressTimer);

                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || data.details || 'Pipeline failed');

                          // Map API response stages to UI stages
                          const finalStages: PipelineStage[] = (data.stages || []).map((s: any) => ({
                            id: s.stage,
                            label: initialStages.find(is => is.id === s.stage)?.label || s.stage,
                            status: s.status,
                            duration: s.duration,
                            error: s.error,
                            counts: s.counts,
                          }));

                          setPipelineStages(finalStages);
                          setPipelineTotalDuration(data.totalDuration);

                          // Wait a moment to show results, then redirect
                          setTimeout(() => {
                            router.push(`/dashboard/${useCaseId}/assess/expansion-review`);
                          }, 2000);
                        } catch (err: any) {
                          setExpansionStatus(`Error: ${err.message}`);
                          setPipelineStages(prev => prev.map(s =>
                            s.status === 'running' || s.status === 'pending'
                              ? { ...s, status: s.status === 'running' ? 'error' : 'pending', error: s.status === 'running' ? err.message : undefined }
                              : s
                          ));
                        } finally {
                          setExpanding(false);
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {expanding ? 'Running Pipeline...' : 'Expand with AI'}
                    </Button>
                  </div>
                </div>
                {showPipeline && (
                  <PipelineProgress
                    stages={pipelineStages}
                    totalDuration={pipelineTotalDuration}
                  />
                )}
              </div>
            )}
          </>
        ) : currentStep === 8 ? (
          /* AI Risk Intelligence */
          isReadOnly ? (
            <ReadOnlyAIRiskIntelligence />
          ) : (
            <AIRiskIntelligence />
          )
        ) : currentStep === 9 ? (
          /* Security Assessment */
          isReadOnly ? (
            <ReadOnlySecurityAssessment />
          ) : (
            <SecurityAssessment />
          )
        ) : currentStep === 10 ? (
          /* AI Guardrails */
          <GuardrailsGenerator useCaseId={useCaseId} />
        ) : currentStep === 11 ? (
          /* AI Evaluations */
          <EvaluationGenerator useCaseId={useCaseId} />
        ) : currentStep === 12 ? (
          /* Golden Dataset */
          <GoldenDatasetDashboard useCaseId={useCaseId} />
        ) : null}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
              pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
              router.push('/dashboard');
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 0 ? 'Dashboard' : 'Previous'}
        </Button>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {currentStep + 1} of {PILLAR_CONFIG.length}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentStep < PILLAR_CONFIG.length - 1) {
              // Save before navigating if on a pillar step
              if (currentStep >= 1 && currentStep <= 7 && !isReadOnly) {
                handleSave();
              }
              setCurrentStep(currentStep + 1);
              pageTopRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          disabled={currentStep >= PILLAR_CONFIG.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
