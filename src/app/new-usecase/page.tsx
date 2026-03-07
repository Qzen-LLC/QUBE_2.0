'use client'

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PillarWizard, type WizardFormData } from '@/components/architect/PillarWizard';
import { PipelineProgressTracker } from '@/components/architect/PipelineProgressTracker';
import { ArchitectOutputDashboard } from '@/components/architect/ArchitectOutputDashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PipelineStep } from '@/hooks/useArchitectPipeline';

interface DraftItem {
  id: string;
  title: string;
  wizardDraft: Record<string, unknown> | null;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
}

function NewUseCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeDraftId = searchParams.get('draft');

  const [phase, setPhase] = useState<'loading' | 'drafts' | 'wizard' | 'generating' | 'done'>('loading');
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>(resumeDraftId ?? undefined);
  const [initialWizardData, setInitialWizardData] = useState<Partial<WizardFormData> | undefined>();
  const [startStep, setStartStep] = useState(0);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [createdUseCaseId, setCreatedUseCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing drafts on mount
  useEffect(() => {
    async function loadDrafts() {
      try {
        const res = await fetch('/api/usecase-draft');
        if (res.ok) {
          const data = await res.json();
          const fetchedDrafts = data.drafts || [];
          setDrafts(fetchedDrafts);

          // If resuming a specific draft from URL param, go straight to wizard
          if (resumeDraftId) {
            const draft = fetchedDrafts.find((d: DraftItem) => d.id === resumeDraftId);
            if (draft?.wizardDraft) {
              const wd = draft.wizardDraft as Record<string, unknown>;
              setInitialWizardData(wd as Partial<WizardFormData>);
              setStartStep((wd.currentStep as number) ?? 0);
              setSelectedDraftId(draft.id);
              setPhase('wizard');
              return;
            }
          }

          // If there are drafts, show the draft picker; otherwise go to wizard
          setPhase(fetchedDrafts.length > 0 ? 'drafts' : 'wizard');
        } else {
          setPhase('wizard');
        }
      } catch {
        setPhase('wizard');
      }
    }
    loadDrafts();
  }, [resumeDraftId]);

  const handleSelectDraft = useCallback((draft: DraftItem) => {
    if (draft.wizardDraft) {
      const wd = draft.wizardDraft as Record<string, unknown>;
      setInitialWizardData(wd as Partial<WizardFormData>);
      setStartStep((wd.currentStep as number) ?? 0);
      // Also set the name from the wizard data in localStorage so it shows in draft banner
      if (typeof window !== 'undefined') {
        localStorage.setItem('qube-wizard-draft', JSON.stringify(wd));
        localStorage.setItem('qube-wizard-step', String((wd.currentStep as number) ?? 0));
      }
    }
    setSelectedDraftId(draft.id);
    setPhase('wizard');
  }, []);

  const handleStartNew = useCallback(() => {
    // Clear any localStorage drafts when starting fresh
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qube-wizard-draft');
      localStorage.removeItem('qube-wizard-step');
    }
    setSelectedDraftId(undefined);
    setInitialWizardData(undefined);
    setStartStep(0);
    setPhase('wizard');
  }, []);

  const handleDraftIdChange = useCallback((id: string) => {
    setSelectedDraftId(id);
  }, []);

  const handleGenerate = useCallback(async (formData: WizardFormData, draftId?: string) => {
    setLoading(true);
    setPipelineError(null);
    try {
      let useCaseId: string;

      if (draftId) {
        // Draft exists — update it from "draft" to "discovery" stage
        const ucRes = await fetch('/api/write-usecases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: draftId,
            title: formData.name,
            problemStatement: (formData.technical as Record<string, unknown>).description || '',
            aiType: (formData.technical as Record<string, unknown>).useCaseCategory || 'Gen AI',
            regulatoryFrameworks: [
              ...((formData.legal as Record<string, unknown>).regulations as string[] || []),
              ...((formData.legal as Record<string, unknown>).governanceFrameworks as string[] || []).filter(
                (f: string) => f === 'EU AI Act' || f === 'UAE AI/GenAI Controls'
              ),
            ],
            industryStandards: ((formData.legal as Record<string, unknown>).governanceFrameworks as string[] || []).filter(
              (f: string) => f === 'ISO/IEC 42001' || f === 'ISO 27001'
            ),
            stage: 'discovery',
            priority: 'MEDIUM',
            proposedAISolution: '',
            businessFunction: '',
          }),
        });
        if (!ucRes.ok) throw new Error('Failed to update use case');
        useCaseId = draftId;
      } else {
        // No draft — create new UseCase record
        const ucRes = await fetch('/api/write-usecases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.name,
            problemStatement: (formData.technical as Record<string, unknown>).description || '',
            aiType: (formData.technical as Record<string, unknown>).useCaseCategory || 'Gen AI',
            regulatoryFrameworks: [
              ...((formData.legal as Record<string, unknown>).regulations as string[] || []),
              ...((formData.legal as Record<string, unknown>).governanceFrameworks as string[] || []).filter(
                (f: string) => f === 'EU AI Act' || f === 'UAE AI/GenAI Controls'
              ),
            ],
            industryStandards: ((formData.legal as Record<string, unknown>).governanceFrameworks as string[] || []).filter(
              (f: string) => f === 'ISO/IEC 42001' || f === 'ISO 27001'
            ),
            stage: 'discovery',
            priority: 'MEDIUM',
            proposedAISolution: '',
            businessFunction: '',
          }),
        });
        if (!ucRes.ok) throw new Error('Failed to create use case');
        const ucData = await ucRes.json();
        useCaseId = ucData.useCase?.id ?? ucData.id;
      }

      setCreatedUseCaseId(useCaseId);

      // Switch to generating phase
      setPhase('generating');
      setPipelineStep('scoring_pillars');

      // Trigger full generation pipeline
      const genRes = await fetch('/api/architect/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, input: formData }),
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || 'Pipeline failed');
      }

      const genData = await genRes.json();
      setPipelineStep('completed');
      setOutput(genData.output);
      setPhase('done');

      setTimeout(() => {
        router.push(`/dashboard/${useCaseId}`);
      }, 2000);
    } catch (err) {
      setPipelineStep('failed');
      setPipelineError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [router]);

  const handleScorePillars = useCallback(async (formData: WizardFormData) => {
    const res = await fetch('/api/architect/score-pillars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Scoring failed');
    }
    return res.json();
  }, []);

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading drafts...</p>
      </div>
    );
  }

  // Draft picker
  if (phase === 'drafts') {
    return (
      <div className="min-h-screen flex justify-center items-start bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-2xl mt-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">New AI Use Case</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Continue a draft or start from scratch.
            </p>
          </div>

          <Button onClick={handleStartNew} className="w-full py-5 text-base">
            Start New Use Case
          </Button>

          {drafts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Continue a Draft
              </h2>
              {drafts.map((draft) => (
                <Card
                  key={draft.id}
                  className="p-4 dark:bg-gray-900 dark:border-gray-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  onClick={() => handleSelectDraft(draft)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold dark:text-white">{draft.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {draft.user.firstName} {draft.user.lastName} &middot;{' '}
                        {new Date(draft.updatedAt).toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                      Draft
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'generating') {
    return (
      <div className="min-h-screen flex justify-center items-start bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-2xl mt-12">
          <PipelineProgressTracker
            currentStep={pipelineStep}
            error={pipelineError}
          />
        </div>
      </div>
    );
  }

  if (phase === 'done' && output && createdUseCaseId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
            Architecture assessment complete. Redirecting to dashboard...
          </div>
          <ArchitectOutputDashboard
            output={output}
            useCaseId={createdUseCaseId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 dark:bg-gray-900 p-0 sm:p-4">
      <div className="w-full max-w-4xl sm:mt-6 sm:mb-6">
        <PillarWizard
          onGenerate={handleGenerate}
          onScorePillars={handleScorePillars}
          loading={loading}
          initialData={initialWizardData}
          startStep={startStep}
          draftId={selectedDraftId}
          onDraftIdChange={handleDraftIdChange}
        />
      </div>
    </div>
  );
}

export default function NewUseCasePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NewUseCaseContent />
    </Suspense>
  );
}
