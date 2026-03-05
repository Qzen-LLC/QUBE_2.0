'use client'

import React, { Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PillarWizard, type WizardFormData } from '@/components/architect/PillarWizard';
import { PipelineProgressTracker } from '@/components/architect/PipelineProgressTracker';
import { ArchitectOutputDashboard } from '@/components/architect/ArchitectOutputDashboard';
import type { PipelineStep } from '@/hooks/useArchitectPipeline';

function NewUseCaseContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<'wizard' | 'generating' | 'done'>('wizard');
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [createdUseCaseId, setCreatedUseCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async (formData: WizardFormData) => {
    setLoading(true);
    setPipelineError(null);
    try {
      // Step 1: Create UseCase record
      const ucRes = await fetch('/api/write-usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.name,
          problemStatement: (formData.technical as Record<string, unknown>).description || '',
          aiType: (formData.technical as Record<string, unknown>).useCaseCategory || 'Gen AI',
          regulatoryFrameworks: (formData.legal as Record<string, unknown>).regulations || [],
          stage: 'discovery',
          priority: 'MEDIUM',
          proposedAISolution: '',
          businessFunction: '',
        }),
      });
      if (!ucRes.ok) throw new Error('Failed to create use case');
      const ucData = await ucRes.json();
      const useCaseId = ucData.id;
      setCreatedUseCaseId(useCaseId);

      // Step 2: Switch to generating phase
      setPhase('generating');
      setPipelineStep('scoring_pillars');

      // Step 3: Trigger full generation pipeline
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

      // Redirect to detail page after brief delay
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
    if (!res.ok) throw new Error('Scoring failed');
    return res.json();
  }, []);

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
