'use client'

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PillarWizard, type WizardFormData } from '@/components/architect/PillarWizard';
import { PipelineProgressTracker } from '@/components/architect/PipelineProgressTracker';
import { ArchitectOutputDashboard } from '@/components/architect/ArchitectOutputDashboard';
import { EnrichedContextReview } from '@/components/architect/EnrichedContextReview';
import type { EnrichedContext } from '@/lib/architect';
import type { PipelineStep } from '@/hooks/useArchitectPipeline';

function NewUseCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeDraftId = searchParams.get('draft');

  const [phase, setPhase] = useState<'loading' | 'wizard' | 'enriching' | 'reviewing' | 'generating' | 'done'>(
    resumeDraftId ? 'loading' : 'wizard'
  );
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>(resumeDraftId ?? undefined);
  const [initialWizardData, setInitialWizardData] = useState<Partial<WizardFormData> | undefined>();
  const [startStep, setStartStep] = useState(0);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [createdUseCaseId, setCreatedUseCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrichedContext, setEnrichedContext] = useState<EnrichedContext | null>(null);
  const [pillarScores, setPillarScores] = useState<Record<string, unknown> | null>(null);
  const [formDataRef, setFormDataRef] = useState<WizardFormData | null>(null);

  // If resuming a draft from URL param, load its wizard data from DB
  useEffect(() => {
    if (!resumeDraftId) return;

    async function loadDraft() {
      try {
        const res = await fetch('/api/usecase-draft');
        if (res.ok) {
          const data = await res.json();
          const drafts = data.drafts || [];
          const draft = drafts.find((d: { id: string }) => d.id === resumeDraftId);
          if (draft?.wizardDraft) {
            const wd = draft.wizardDraft as Record<string, unknown>;
            // If user was in review phase, restore directly to review screen
            if (wd._phase === 'reviewing' && wd._enrichedContext) {
              setEnrichedContext(wd._enrichedContext as EnrichedContext);
              setPillarScores((wd._pillarScores as Record<string, unknown>) ?? {});
              setFormDataRef(wd as unknown as WizardFormData);
              setCreatedUseCaseId(draft.id);
              setSelectedDraftId(draft.id);
              setPhase('reviewing');
              return;
            }
            setInitialWizardData(wd as Partial<WizardFormData>);
            setStartStep((wd.currentStep as number) ?? 0);
            setSelectedDraftId(draft.id);
          }
        }
      } catch {
        // Draft load failed — start fresh
      }
      setPhase('wizard');
    }
    loadDraft();
  }, [resumeDraftId]);

  const handleDraftIdChange = useCallback((id: string) => {
    setSelectedDraftId(id);
    // Update URL so draft survives full page reload
    router.replace(`/new-usecase?draft=${id}`, { scroll: false });
  }, [router]);

  // Helper to create/update UseCase record
  const ensureUseCase = useCallback(async (formData: WizardFormData, draftId?: string): Promise<string> => {
    const payload = {
      ...(draftId ? { id: draftId } : {}),
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
    };

    const ucRes = await fetch('/api/write-usecases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!ucRes.ok) throw new Error(draftId ? 'Failed to update use case' : 'Failed to create use case');

    if (draftId) return draftId;
    const ucData = await ucRes.json();
    return ucData.useCase?.id ?? ucData.id;
  }, []);

  // Step 1: Enrich — called from wizard's Generate button
  const handleEnrich = useCallback(async (formData: WizardFormData, draftId?: string) => {
    setLoading(true);
    setPipelineError(null);
    setFormDataRef(formData);

    try {
      const useCaseId = await ensureUseCase(formData, draftId);
      setCreatedUseCaseId(useCaseId);

      // Switch to enriching phase
      setPhase('enriching');

      const enrichRes = await fetch('/api/architect/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseId, input: formData }),
      });

      if (!enrichRes.ok) {
        const err = await enrichRes.json();
        throw new Error(err.error || 'Enrichment failed');
      }

      const enrichData = await enrichRes.json();
      setEnrichedContext(enrichData.enrichedContext);
      setPillarScores(enrichData.pillarScores);

      // Save review state to draft for resume
      try {
        await fetch('/api/usecase-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: useCaseId,
            wizardDraft: {
              ...formData,
              _phase: 'reviewing',
              _enrichedContext: enrichData.enrichedContext,
              _pillarScores: enrichData.pillarScores,
            },
          }),
        });
      } catch {
        // Non-critical — draft save failure shouldn't block review
      }

      setPhase('reviewing');
      setLoading(false);
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('wizard');
      setLoading(false);
    }
  }, [ensureUseCase]);

  // Step 2: Confirm & Generate — called from review component
  const handleConfirmGenerate = useCallback(async (context: EnrichedContext) => {
    if (!createdUseCaseId || !formDataRef) return;

    setLoading(true);
    setPipelineError(null);
    setPhase('generating');
    setPipelineStep('scoring_pillars');

    try {
      const genRes = await fetch('/api/architect/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId: createdUseCaseId,
          input: formDataRef,
          enrichedContext: context,
          pillarScores,
        }),
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
        router.push(`/dashboard/${createdUseCaseId}`);
      }, 2000);
    } catch (err) {
      setPipelineStep('failed');
      setPipelineError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [router, createdUseCaseId, formDataRef, pillarScores]);

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

  // Loading state (only when resuming a draft)
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading draft...</p>
      </div>
    );
  }

  if (phase === 'enriching') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">Analyzing your inputs...</p>
        </div>
      </div>
    );
  }

  if (phase === 'reviewing' && enrichedContext) {
    return (
      <EnrichedContextReview
        enrichedContext={enrichedContext}
        pillarScores={pillarScores ?? {}}
        onConfirm={handleConfirmGenerate}
        onBack={() => setPhase('wizard')}
        loading={loading}
      />
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
          onGenerate={handleEnrich}
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
