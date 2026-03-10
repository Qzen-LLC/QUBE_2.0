'use client';

import React, { useState, useCallback } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import type { EnrichedContext, ArchitectureComponent } from '@/lib/architect';

interface EnrichedContextReviewProps {
  enrichedContext: EnrichedContext;
  pillarScores: Record<string, unknown>;
  onConfirm: (context: EnrichedContext) => void;
  onBack: () => void;
  loading: boolean;
}

type FieldOverrides = Record<string, boolean>;

const DEPLOYMENT_OPTIONS = ['aws', 'azure', 'gcp', 'on_prem', 'hybrid'] as const;
const ORCHESTRATION_OPTIONS = ['simple_chain', 'dag', 'router', 'map_reduce', 'autonomous_agent'] as const;
const TIER_OPTIONS = ['tier_1', 'tier_2', 'tier_3'] as const;
const OVERSIGHT_OPTIONS = ['none', 'escalation_only', 'review_before_action', 'always_in_loop'] as const;
const IMPACT_OPTIONS = ['informational', 'advisory', 'decision_support', 'autonomous'] as const;
const DATA_CLASSIFICATION_OPTIONS = ['public', 'internal', 'confidential', 'restricted'] as const;

function Badge({ overridden }: { overridden: boolean }) {
  return overridden ? (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      Overridden
    </span>
  ) : (
    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      Inferred
    </span>
  );
}

function FieldRow({
  label,
  fieldKey,
  children,
  overrides,
}: {
  label: string;
  fieldKey: string;
  children: React.ReactNode;
  overrides: FieldOverrides;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center min-w-[200px]">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <Badge overridden={!!overrides[fieldKey]} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
}) {
  return (
    <select
      className="w-full sm:w-auto px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}

function NumberField({
  value,
  onChange,
  min,
  step,
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      className="w-full sm:w-32 px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      value={value}
      min={min ?? 0}
      step={step ?? 1}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function TextField({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <input
      type="text"
      className="w-full sm:w-64 px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ReadOnlyField({ value }: { value: string }) {
  return <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>;
}

function PillarScoreBadge({ score }: { score: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    blocker: 'bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[score] || colors.amber}`}>
      {score}
    </span>
  );
}

const COMPONENT_TYPE_OPTIONS = ['llm', 'orchestrator', 'vector_db', 'embedding', 'tool_registry', 'state_store', 'cache', 'gateway', 'monitoring', 'custom'] as const;

function ComponentCard({
  component,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onRemove,
}: {
  component: ArchitectureComponent;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (updated: ArchitectureComponent) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<ArchitectureComponent>(component);

  // Reset draft when entering edit mode
  React.useEffect(() => {
    if (isEditing) setDraft(component);
  }, [isEditing, component]);

  if (isEditing) {
    return (
      <div className="p-3 border-2 border-indigo-400 dark:border-indigo-500 rounded-lg bg-white dark:bg-gray-800 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Model / Service</label>
            <input
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              value={draft.modelOrService}
              onChange={(e) => setDraft({ ...draft, modelOrService: e.target.value })}
              placeholder="e.g. gpt-4o"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Provider</label>
            <input
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              value={draft.provider}
              onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
              placeholder="e.g. openai"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Type</label>
          <select
            className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          >
            {COMPONENT_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">$/M input tokens</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              value={draft.pricing.inputPerMtok ?? ''}
              onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, inputPerMtok: e.target.value ? Number(e.target.value) : null } })}
              placeholder="—"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">$/M output tokens</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
              value={draft.pricing.outputPerMtok ?? ''}
              onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, outputPerMtok: e.target.value ? Number(e.target.value) : null } })}
              placeholder="—"
              step="0.01"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-gray-500 dark:text-gray-400">Monthly base ($)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            value={draft.pricing.monthlyBase ?? ''}
            onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, monthlyBase: e.target.value ? Number(e.target.value) : null } })}
            placeholder="—"
            step="1"
          />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="text-xs px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group relative"
      onClick={onStartEdit}
      title="Click to edit"
    >
      <div className="font-medium text-sm text-gray-900 dark:text-white">
        {component.modelOrService || '(unnamed)'}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {component.provider || '—'} &middot; {component.type}
      </div>
      {(component.pricing.inputPerMtok != null || component.pricing.monthlyBase != null) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {component.pricing.inputPerMtok != null && `$${component.pricing.inputPerMtok}/M input`}
          {component.pricing.outputPerMtok != null && ` · $${component.pricing.outputPerMtok}/M output`}
          {component.pricing.monthlyBase != null && `$${component.pricing.monthlyBase}/mo`}
        </div>
      )}
      <span className="absolute top-2 right-2 text-[10px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition">
        edit
      </span>
    </div>
  );
}

export function EnrichedContextReview({
  enrichedContext: initialContext,
  pillarScores,
  onConfirm,
  onBack,
  loading,
}: EnrichedContextReviewProps) {
  const [context, setContext] = useState<EnrichedContext>(initialContext);
  const [overrides, setOverrides] = useState<FieldOverrides>({});
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof EnrichedContext>(
      section: K,
      field: string,
      value: unknown,
      fieldKey: string
    ) => {
      setContext((prev) => {
        const sectionVal = prev[section];
        if (typeof sectionVal === 'object' && sectionVal !== null) {
          return { ...prev, [section]: { ...(sectionVal as Record<string, unknown>), [field]: value } };
        }
        return { ...prev, [section]: value };
      });
      setOverrides((prev) => ({ ...prev, [fieldKey]: true }));
    },
    []
  );

  const updateTopLevel = useCallback(
    (field: keyof EnrichedContext, value: unknown, fieldKey: string) => {
      setContext((prev) => ({ ...prev, [field]: value }));
      setOverrides((prev) => ({ ...prev, [fieldKey]: true }));
    },
    []
  );

  const scores = pillarScores as Record<string, { score?: string; rationale?: string }>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Inferred Parameters
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            The AI has analyzed your inputs and inferred the following parameters.
            Review and optionally override any values before generating your full assessment.
          </p>
        </div>

        <Accordion type="single" collapsible>
          {/* Section 1: Architecture & Components */}
          <AccordionItem value="architecture">
            <AccordionTrigger>Architecture &amp; Components</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Orchestration Pattern" fieldKey="orchestrationPattern" overrides={overrides}>
                  <SelectField
                    value={context.technical.orchestrationPattern}
                    options={ORCHESTRATION_OPTIONS}
                    onChange={(v) => updateField('technical', 'orchestrationPattern', v, 'orchestrationPattern')}
                  />
                </FieldRow>

                {/* Components — editable cards */}
                <div className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Components</span>
                      <Badge overridden={!!overrides['components']} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newComp: ArchitectureComponent = {
                          id: `comp-${Date.now()}`,
                          type: 'custom',
                          provider: '',
                          modelOrService: '',
                          pricing: {
                            inputPerMtok: null,
                            outputPerMtok: null,
                            perMillionVectors: null,
                            monthlyBase: null,
                            perRequest: null,
                          },
                        };
                        const updated = [...context.technical.components, newComp];
                        updateField('technical', 'components', updated, 'components');
                        setEditingComponentId(newComp.id);
                      }}
                      className="text-xs px-2.5 py-1 rounded border border-dashed border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      + Add Component
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {context.technical.components.map((comp) => (
                      <ComponentCard
                        key={comp.id}
                        component={comp}
                        isEditing={editingComponentId === comp.id}
                        onStartEdit={() => setEditingComponentId(comp.id)}
                        onSave={(updated) => {
                          const comps = context.technical.components.map((c) =>
                            c.id === comp.id ? updated : c
                          );
                          updateField('technical', 'components', comps, 'components');
                          setEditingComponentId(null);
                        }}
                        onCancel={() => setEditingComponentId(null)}
                        onRemove={() => {
                          const comps = context.technical.components.filter((c) => c.id !== comp.id);
                          updateField('technical', 'components', comps, 'components');
                          setEditingComponentId(null);
                        }}
                      />
                    ))}
                    {context.technical.components.length === 0 && (
                      <div className="text-sm text-gray-400 dark:text-gray-500">No components — click &quot;+ Add Component&quot; to add one</div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Deployment & Infrastructure */}
          <AccordionItem value="deployment">
            <AccordionTrigger>Deployment &amp; Infrastructure</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Deployment Target" fieldKey="deploymentTarget" overrides={overrides}>
                  <SelectField
                    value={context.technical.deploymentTarget}
                    options={DEPLOYMENT_OPTIONS}
                    onChange={(v) => updateField('technical', 'deploymentTarget', v, 'deploymentTarget')}
                  />
                </FieldRow>
                <FieldRow label="Region" fieldKey="region" overrides={overrides}>
                  <TextField
                    value={context.technical.region}
                    onChange={(v) => updateField('technical', 'region', v, 'region')}
                  />
                </FieldRow>
                <FieldRow label="Topology" fieldKey="topology" overrides={overrides}>
                  <TextField
                    value={context.technical.topology}
                    onChange={(v) => updateField('technical', 'topology', v, 'topology')}
                  />
                </FieldRow>
                <FieldRow label="Latency Target (ms)" fieldKey="latencyTargetMs" overrides={overrides}>
                  <NumberField
                    value={context.technical.latencyTargetMs}
                    onChange={(v) => updateField('technical', 'latencyTargetMs', v, 'latencyTargetMs')}
                    min={100}
                    step={100}
                  />
                </FieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Traffic & Cost Estimates */}
          <AccordionItem value="traffic">
            <AccordionTrigger>Traffic &amp; Cost Estimates</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Daily Requests" fieldKey="dailyRequests" overrides={overrides}>
                  <NumberField
                    value={context.business.dailyRequests}
                    onChange={(v) => updateField('business', 'dailyRequests', v, 'dailyRequests')}
                    min={1}
                  />
                </FieldRow>
                <FieldRow label="Avg Input Tokens" fieldKey="avgInputTokens" overrides={overrides}>
                  <NumberField
                    value={context.business.avgInputTokens}
                    onChange={(v) => updateField('business', 'avgInputTokens', v, 'avgInputTokens')}
                    min={1}
                  />
                </FieldRow>
                <FieldRow label="Avg Output Tokens" fieldKey="avgOutputTokens" overrides={overrides}>
                  <NumberField
                    value={context.business.avgOutputTokens}
                    onChange={(v) => updateField('business', 'avgOutputTokens', v, 'avgOutputTokens')}
                    min={1}
                  />
                </FieldRow>
                <FieldRow label="Monthly Growth Rate" fieldKey="growthRateMonthly" overrides={overrides}>
                  <NumberField
                    value={context.business.growthRateMonthly}
                    onChange={(v) => updateField('business', 'growthRateMonthly', v, 'growthRateMonthly')}
                    min={0}
                    step={0.01}
                  />
                </FieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 4: Governance Classification */}
          <AccordionItem value="governance">
            <AccordionTrigger>Governance Classification</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Recommended Tier" fieldKey="recommendedTier" overrides={overrides}>
                  <SelectField
                    value={context.recommendedTier}
                    options={TIER_OPTIONS}
                    onChange={(v) => updateTopLevel('recommendedTier', v, 'recommendedTier')}
                  />
                </FieldRow>
                <FieldRow label="Human Oversight Model" fieldKey="humanOversightModel" overrides={overrides}>
                  <SelectField
                    value={context.responsible.humanOversightModel}
                    options={OVERSIGHT_OPTIONS}
                    onChange={(v) => updateField('responsible', 'humanOversightModel', v, 'humanOversightModel')}
                  />
                </FieldRow>
                <FieldRow label="Decision Impact Level" fieldKey="decisionImpactLevel" overrides={overrides}>
                  <SelectField
                    value={context.responsible.decisionImpactLevel}
                    options={IMPACT_OPTIONS}
                    onChange={(v) => updateField('responsible', 'decisionImpactLevel', v, 'decisionImpactLevel')}
                  />
                </FieldRow>
                <FieldRow label="Data Classification" fieldKey="dataClassification" overrides={overrides}>
                  <SelectField
                    value={context.legal.dataClassification}
                    options={DATA_CLASSIFICATION_OPTIONS}
                    onChange={(v) => updateField('legal', 'dataClassification', v, 'dataClassification')}
                  />
                </FieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 5: Assessment Summary (read-only) */}
          <AccordionItem value="summary">
            <AccordionTrigger>Assessment Summary</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Overall Risk Posture" fieldKey="overallRiskPosture" overrides={overrides}>
                  <ReadOnlyField value={context.overallRiskPosture} />
                </FieldRow>
                <FieldRow label="Estimated Complexity" fieldKey="estimatedComplexity" overrides={overrides}>
                  <ReadOnlyField value={context.estimatedComplexity} />
                </FieldRow>
                <FieldRow label="Confidence" fieldKey="confidence" overrides={overrides}>
                  <ReadOnlyField value={`${(context.confidence * 100).toFixed(0)}%`} />
                </FieldRow>

                {/* Pillar Scores */}
                <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pillar Scores</span>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {(['technical', 'business', 'responsible', 'legal', 'data_readiness'] as const).map((pillar) => {
                      const s = scores[pillar];
                      const displayName = pillar.replace(/_/g, ' ');
                      return (
                        <div key={pillar} className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayName}:</span>
                          <PillarScoreBadge score={s?.score ?? 'amber'} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bias Risk Factors */}
                {context.responsible.biasRiskFactors.length > 0 && (
                  <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bias Risk Factors</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {context.responsible.biasRiskFactors.map((factor) => (
                        <span
                          key={factor}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regulations */}
                {context.legal.regulations.length > 0 && (
                  <div className="py-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Regulations</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {context.legal.regulations.map((reg) => (
                        <span
                          key={reg}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        >
                          {reg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            Back to Wizard
          </button>
          <button
            type="button"
            onClick={() => onConfirm(context)}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Confirm & Generate'}
          </button>
        </div>

        {/* Override count */}
        {Object.keys(overrides).length > 0 && (
          <div className="mt-3 text-right text-xs text-gray-500 dark:text-gray-400">
            {Object.keys(overrides).length} field{Object.keys(overrides).length !== 1 ? 's' : ''} overridden
          </div>
        )}
      </div>
    </div>
  );
}
