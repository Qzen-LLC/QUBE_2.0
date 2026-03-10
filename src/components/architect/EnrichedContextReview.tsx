'use client';

import React, { useState, useCallback } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
const EU_AI_ACT_OPTIONS = ['minimal', 'limited', 'high_risk', 'prohibited'] as const;
const AUDIT_ENFORCEMENT_OPTIONS = ['none', 'periodic', 'continuous', 'critical'] as const;
const AUTH_MODEL_OPTIONS = ['api_key', 'oauth2', 'saml', 'mfa', 'zero_trust'] as const;
const VENDOR_RISK_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const GO_NO_GO_OPTIONS = ['go', 'conditional_go', 'no_go'] as const;
const EVAL_PLATFORM_OPTIONS = ['langfuse', 'langsmith', 'custom', 'none'] as const;
const STALENESS_RISK_OPTIONS = ['none', 'low', 'medium', 'high'] as const;
const REVIEW_CADENCE_OPTIONS = ['weekly', 'monthly', 'quarterly', 'annually'] as const;
const COST_SENSITIVITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const SCALING_PROFILE_OPTIONS = ['flat', 'linear', 'exponential'] as const;
const STRATEGIC_IMPORTANCE_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const MATURITY_OPTIONS = ['nascent', 'developing', 'established', 'advanced'] as const;
const EXPOSURE_OPTIONS = ['none', 'internal_only', 'partner_api', 'public_api'] as const;
const FAILOVER_OPTIONS = ['none', 'active_passive', 'active_active', 'multi_region'] as const;
const DEPLOYMENT_STRATEGY_OPTIONS = ['direct', 'rolling', 'blue_green', 'canary'] as const;

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

function BooleanBadge({ value }: { value: boolean | null | undefined }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  return value ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Yes</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">No</span>
  );
}

function TagList({ tags }: { tags: string[] | null | undefined }) {
  if (!tags?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
          {tag}
        </span>
      ))}
    </div>
  );
}

function MiniTable({ data, columns }: { data: Record<string, unknown>[] | null | undefined; columns: { key: string; label: string }[] }) {
  if (!data?.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className="px-2 py-1 text-left font-medium text-muted-foreground">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="px-2 py-1 text-foreground">{String(row[col.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
      <div className="flex items-center min-w-[200px]">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge overridden={!!overrides[fieldKey]} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ReadOnlyFieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-border last:border-0">
      <div className="flex items-center min-w-[200px]">
        <span className="text-sm font-medium text-foreground">{label}</span>
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
      className="w-full sm:w-auto px-3 py-1.5 text-sm border rounded-md bg-background border-border text-foreground"
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
      className="w-full sm:w-32 px-3 py-1.5 text-sm border rounded-md bg-background border-border text-foreground"
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
      className="w-full sm:w-64 px-3 py-1.5 text-sm border rounded-md bg-background border-border text-foreground"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ReadOnlyField({ value }: { value: string }) {
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

function ToggleField({ value, onChange }: { value: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${value ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
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

function GoNoGoBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    go: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    conditional_go: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    no_go: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[value] || colors.conditional_go}`}>
      {value.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

function BadgedList({ items, color }: { items: string[] | null | undefined; color: 'red' | 'amber' }) {
  if (!items?.length) return <span className="text-xs text-muted-foreground">None</span>;
  const cls = color === 'red'
    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <span key={i} className={`inline-flex items-center px-2 py-1 rounded text-xs border ${cls}`}>
          {item}
        </span>
      ))}
    </div>
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
      <div className="p-3 border-2 border-primary rounded-lg bg-card space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Model / Service</label>
            <input
              className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
              value={draft.modelOrService}
              onChange={(e) => setDraft({ ...draft, modelOrService: e.target.value })}
              placeholder="e.g. gpt-4o"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Provider</label>
            <input
              className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
              value={draft.provider}
              onChange={(e) => setDraft({ ...draft, provider: e.target.value })}
              placeholder="e.g. openai"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Type</label>
          <select
            className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
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
            <label className="text-[10px] uppercase text-muted-foreground">$/M input tokens</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
              value={draft.pricing.inputPerMtok ?? ''}
              onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, inputPerMtok: e.target.value ? Number(e.target.value) : null } })}
              placeholder="—"
              step="0.01"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">$/M output tokens</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
              value={draft.pricing.outputPerMtok ?? ''}
              onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, outputPerMtok: e.target.value ? Number(e.target.value) : null } })}
              placeholder="—"
              step="0.01"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Monthly base ($)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-sm border rounded bg-background border-border text-foreground"
            value={draft.pricing.monthlyBase ?? ''}
            onChange={(e) => setDraft({ ...draft, pricing: { ...draft.pricing, monthlyBase: e.target.value ? Number(e.target.value) : null } })}
            placeholder="—"
            step="1"
          />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border">
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
              className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:bg-muted"
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
      className="p-3 border rounded-lg bg-muted/50 border-border cursor-pointer hover:border-primary transition group relative"
      onClick={onStartEdit}
      title="Click to edit"
    >
      <div className="font-medium text-sm text-foreground">
        {component.modelOrService || '(unnamed)'}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {component.provider || '—'} &middot; {component.type}
      </div>
      {(component.pricing.inputPerMtok != null || component.pricing.monthlyBase != null) && (
        <div className="text-xs text-muted-foreground mt-1">
          {component.pricing.inputPerMtok != null && `$${component.pricing.inputPerMtok}/M input`}
          {component.pricing.outputPerMtok != null && ` · $${component.pricing.outputPerMtok}/M output`}
          {component.pricing.monthlyBase != null && `$${component.pricing.monthlyBase}/mo`}
        </div>
      )}
      <span className="absolute top-2 right-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition">
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Review Inferred Parameters
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
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
                      <span className="text-sm font-medium text-foreground">Components</span>
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
                      className="text-xs px-2.5 py-1 rounded border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition"
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
                      <div className="text-sm text-muted-foreground">No components — click &quot;+ Add Component&quot; to add one</div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Deployment & Infrastructure (extended) */}
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
                <FieldRow label="Failover Strategy" fieldKey="failoverStrategy" overrides={overrides}>
                  <SelectField
                    value={context.technical.failoverStrategy ?? 'none'}
                    options={FAILOVER_OPTIONS}
                    onChange={(v) => updateField('technical', 'failoverStrategy', v, 'failoverStrategy')}
                  />
                </FieldRow>
                <FieldRow label="Deployment Strategy" fieldKey="deploymentStrategy" overrides={overrides}>
                  <SelectField
                    value={context.technical.deploymentStrategy ?? 'rolling'}
                    options={DEPLOYMENT_STRATEGY_OPTIONS}
                    onChange={(v) => updateField('technical', 'deploymentStrategy', v, 'deploymentStrategy')}
                  />
                </FieldRow>
                <FieldRow label="Infra Maturity Level" fieldKey="infrastructureMaturityLevel" overrides={overrides}>
                  <SelectField
                    value={context.technical.infrastructureMaturityLevel ?? 'developing'}
                    options={MATURITY_OPTIONS}
                    onChange={(v) => updateField('technical', 'infrastructureMaturityLevel', v, 'infrastructureMaturityLevel')}
                  />
                </FieldRow>
                <FieldRow label="API Surface Exposure" fieldKey="apiSurfaceExposure" overrides={overrides}>
                  <SelectField
                    value={context.technical.apiSurfaceExposure ?? 'internal_only'}
                    options={EXPOSURE_OPTIONS}
                    onChange={(v) => updateField('technical', 'apiSurfaceExposure', v, 'apiSurfaceExposure')}
                  />
                </FieldRow>
                <FieldRow label="Multi-Vendor Count" fieldKey="multiVendorCount" overrides={overrides}>
                  <NumberField
                    value={context.technical.multiVendorCount ?? 1}
                    onChange={(v) => updateField('technical', 'multiVendorCount', v, 'multiVendorCount')}
                    min={0}
                  />
                </FieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Traffic & Cost Estimates (extended) */}
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
                <FieldRow label="Cost Sensitivity" fieldKey="costSensitivityLevel" overrides={overrides}>
                  <SelectField
                    value={context.business.costSensitivityLevel ?? 'medium'}
                    options={COST_SENSITIVITY_OPTIONS}
                    onChange={(v) => updateField('business', 'costSensitivityLevel', v, 'costSensitivityLevel')}
                  />
                </FieldRow>
                <FieldRow label="Budget Ceiling ($/mo)" fieldKey="budgetCeilingUsdMonthly" overrides={overrides}>
                  <NumberField
                    value={context.business.budgetCeilingUsdMonthly ?? 0}
                    onChange={(v) => updateField('business', 'budgetCeilingUsdMonthly', v || null, 'budgetCeilingUsdMonthly')}
                    min={0}
                    step={100}
                  />
                </FieldRow>
                <FieldRow label="Scaling Profile" fieldKey="scalingProfile" overrides={overrides}>
                  <SelectField
                    value={context.business.scalingProfile ?? 'linear'}
                    options={SCALING_PROFILE_OPTIONS}
                    onChange={(v) => updateField('business', 'scalingProfile', v, 'scalingProfile')}
                  />
                </FieldRow>
                <FieldRow label="Strategic Importance" fieldKey="strategicImportance" overrides={overrides}>
                  <SelectField
                    value={context.business.strategicImportance ?? 'medium'}
                    options={STRATEGIC_IMPORTANCE_OPTIONS}
                    onChange={(v) => updateField('business', 'strategicImportance', v, 'strategicImportance')}
                  />
                </FieldRow>
                <FieldRow label="Pilot Recommended" fieldKey="pilotRecommended" overrides={overrides}>
                  <ToggleField
                    value={context.business.pilotRecommended ?? false}
                    onChange={(v) => updateField('business', 'pilotRecommended', v, 'pilotRecommended')}
                  />
                </FieldRow>
                {context.business.costPerRequestEstimatedUsd != null && (
                  <ReadOnlyFieldRow label="Est. Cost/Request">
                    <ReadOnlyField value={`$${context.business.costPerRequestEstimatedUsd.toFixed(4)}`} />
                  </ReadOnlyFieldRow>
                )}
                {context.business.modelAlternativeCostDelta?.length ? (
                  <ReadOnlyFieldRow label="Model Alternatives">
                    <MiniTable
                      data={context.business.modelAlternativeCostDelta as unknown as Record<string, unknown>[]}
                      columns={[
                        { key: 'model', label: 'Model' },
                        { key: 'savingsPercent', label: 'Savings %' },
                      ]}
                    />
                  </ReadOnlyFieldRow>
                ) : null}
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

          {/* Section 5: Security & Compliance (NEW) */}
          <AccordionItem value="security">
            <AccordionTrigger>Security &amp; Compliance</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="EU AI Act Category" fieldKey="euAiActRiskCategory" overrides={overrides}>
                  <SelectField
                    value={context.legal.euAiActRiskCategory ?? 'minimal'}
                    options={EU_AI_ACT_OPTIONS}
                    onChange={(v) => updateField('legal', 'euAiActRiskCategory', v, 'euAiActRiskCategory')}
                  />
                </FieldRow>
                <FieldRow label="Regulatory Burden (1-10)" fieldKey="regulatoryBurdenScore" overrides={overrides}>
                  <NumberField
                    value={context.legal.regulatoryBurdenScore ?? 1}
                    onChange={(v) => updateField('legal', 'regulatoryBurdenScore', v, 'regulatoryBurdenScore')}
                    min={1}
                    step={1}
                  />
                </FieldRow>
                <FieldRow label="Audit Enforcement" fieldKey="auditEnforcementLevel" overrides={overrides}>
                  <SelectField
                    value={context.legal.auditEnforcementLevel ?? 'none'}
                    options={AUDIT_ENFORCEMENT_OPTIONS}
                    onChange={(v) => updateField('legal', 'auditEnforcementLevel', v, 'auditEnforcementLevel')}
                  />
                </FieldRow>
                <FieldRow label="Authentication Model" fieldKey="authenticationModel" overrides={overrides}>
                  <SelectField
                    value={context.legal.authenticationModel ?? 'api_key'}
                    options={AUTH_MODEL_OPTIONS}
                    onChange={(v) => updateField('legal', 'authenticationModel', v, 'authenticationModel')}
                  />
                </FieldRow>
                <FieldRow label="Zero Trust Required" fieldKey="zeroTrustRequired" overrides={overrides}>
                  <ToggleField
                    value={context.legal.zeroTrustRequired ?? false}
                    onChange={(v) => updateField('legal', 'zeroTrustRequired', v, 'zeroTrustRequired')}
                  />
                </FieldRow>
                <FieldRow label="Secrets Mgmt Required" fieldKey="secretsManagementRequired" overrides={overrides}>
                  <ToggleField
                    value={context.legal.secretsManagementRequired ?? false}
                    onChange={(v) => updateField('legal', 'secretsManagementRequired', v, 'secretsManagementRequired')}
                  />
                </FieldRow>
                <FieldRow label="Vendor Supply Chain Risk" fieldKey="vendorSupplyChainRiskLevel" overrides={overrides}>
                  <SelectField
                    value={context.legal.vendorSupplyChainRiskLevel ?? 'low'}
                    options={VENDOR_RISK_OPTIONS}
                    onChange={(v) => updateField('legal', 'vendorSupplyChainRiskLevel', v, 'vendorSupplyChainRiskLevel')}
                  />
                </FieldRow>
                <ReadOnlyFieldRow label="Data Residency">
                  <TagList tags={context.legal.dataResidencyRequirements} />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Sensitive Data Flow">
                  <BooleanBadge value={context.legal.sensitiveDataFlowExists} />
                </ReadOnlyFieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 6: Safety & Governance (NEW) */}
          <AccordionItem value="safety">
            <AccordionTrigger>Safety &amp; Governance</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <FieldRow label="Go/No-Go" fieldKey="goNoGoRecommendation" overrides={overrides}>
                  <div className="flex items-center gap-3">
                    <GoNoGoBadge value={context.goNoGoRecommendation} />
                    <SelectField
                      value={context.goNoGoRecommendation ?? 'conditional_go'}
                      options={GO_NO_GO_OPTIONS}
                      onChange={(v) => updateTopLevel('goNoGoRecommendation', v, 'goNoGoRecommendation')}
                    />
                  </div>
                </FieldRow>
                <ReadOnlyFieldRow label="Guardrail Layers">
                  <TagList tags={context.responsible.guardrailLayersRequired} />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Human Review Required">
                  <BooleanBadge value={context.responsible.humanReviewRequired} />
                </ReadOnlyFieldRow>
                <FieldRow label="Eval Platform" fieldKey="evalPlatformHint" overrides={overrides}>
                  <SelectField
                    value={context.responsible.evalPlatformHint ?? 'none'}
                    options={EVAL_PLATFORM_OPTIONS}
                    onChange={(v) => updateField('responsible', 'evalPlatformHint', v, 'evalPlatformHint')}
                  />
                </FieldRow>
                <ReadOnlyFieldRow label="Approval Conditions">
                  {context.responsible.conditionalApprovalConditions?.length ? (
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {context.responsible.conditionalApprovalConditions.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Protected Attributes">
                  <TagList tags={context.responsible.protectedAttributes} />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Transparency Obligations">
                  {context.responsible.transparencyObligations?.length ? (
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {context.responsible.transparencyObligations.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Stage Gates">
                  <MiniTable
                    data={context.responsible.stageGateRequirements as unknown as Record<string, unknown>[] | undefined}
                    columns={[
                      { key: 'gate', label: 'Gate' },
                      { key: 'owner', label: 'Owner' },
                      { key: 'criteria', label: 'Criteria' },
                    ]}
                  />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Remediation Roadmap">
                  <MiniTable
                    data={context.responsible.remediationRoadmap as unknown as Record<string, unknown>[] | undefined}
                    columns={[
                      { key: 'priority', label: 'Priority' },
                      { key: 'action', label: 'Action' },
                      { key: 'owner', label: 'Owner' },
                    ]}
                  />
                </ReadOnlyFieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 7: Readiness & Quality (NEW) */}
          <AccordionItem value="readiness">
            <AccordionTrigger>Readiness &amp; Quality</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 px-4">
                <ReadOnlyFieldRow label="Readiness Blockers">
                  <BadgedList items={context.readinessBlockers} color="red" />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Cross-Pillar Conflicts">
                  <BadgedList items={context.crossPillarConflicts} color="amber" />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Assumption Log">
                  <MiniTable
                    data={context.assumptionLog as unknown as Record<string, unknown>[] | undefined}
                    columns={[
                      { key: 'field', label: 'Field' },
                      { key: 'assumed', label: 'Assumed Value' },
                      { key: 'risk', label: 'Risk if Wrong' },
                    ]}
                  />
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Follow-Up Questions">
                  {context.followUpQuestionsRequired?.length ? (
                    <div className="space-y-1">
                      {context.followUpQuestionsRequired.map((q, i) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground mr-1.5">{q.pillar}</span>
                          {q.question}
                          {q.impact && <span className="text-xs ml-1 text-muted-foreground">(impact: {q.impact})</span>}
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </ReadOnlyFieldRow>
                <ReadOnlyFieldRow label="Confidence Factors">
                  {context.confidenceFactors ? (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(context.confidenceFactors).map(([pillar, level]) => (
                        <div key={pillar} className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground capitalize">{pillar.replace(/_/g, ' ')}:</span>
                          <PillarScoreBadge score={level === 'high' ? 'green' : level === 'low' ? 'red' : 'amber'} />
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </ReadOnlyFieldRow>
                <FieldRow label="Review Cadence" fieldKey="periodicReviewCadence" overrides={overrides}>
                  <SelectField
                    value={context.dataReadiness.periodicReviewCadence ?? 'quarterly'}
                    options={REVIEW_CADENCE_OPTIONS}
                    onChange={(v) => updateField('dataReadiness', 'periodicReviewCadence', v, 'periodicReviewCadence')}
                  />
                </FieldRow>
                <ReadOnlyFieldRow label="Observability Required">
                  <BooleanBadge value={context.dataReadiness.observabilityRequired} />
                </ReadOnlyFieldRow>
                <FieldRow label="Data Staleness Risk" fieldKey="dataStalenessRisk" overrides={overrides}>
                  <SelectField
                    value={context.dataReadiness.dataStalenessRisk ?? 'low'}
                    options={STALENESS_RISK_OPTIONS}
                    onChange={(v) => updateField('dataReadiness', 'dataStalenessRisk', v, 'dataStalenessRisk')}
                  />
                </FieldRow>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 8: Assessment Summary (read-only) */}
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
                <div className="py-3 border-b border-border">
                  <span className="text-sm font-medium text-foreground">Pillar Scores</span>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {(['technical', 'business', 'responsible', 'legal', 'data_readiness'] as const).map((pillar) => {
                      const s = scores[pillar];
                      const displayName = pillar.replace(/_/g, ' ');
                      return (
                        <div key={pillar} className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground capitalize">{displayName}:</span>
                          <PillarScoreBadge score={s?.score ?? 'amber'} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bias Risk Factors */}
                {context.responsible.biasRiskFactors.length > 0 && (
                  <div className="py-3 border-b border-border">
                    <span className="text-sm font-medium text-foreground">Bias Risk Factors</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {context.responsible.biasRiskFactors.map((factor) => (
                        <span
                          key={factor}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
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
                    <span className="text-sm font-medium text-foreground">Regulations</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {context.legal.regulations.map((reg) => (
                        <span
                          key={reg}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
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
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack} disabled={loading}>
            Back to Wizard
          </Button>
          <div className="flex items-center gap-3">
            {Object.keys(overrides).length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Object.keys(overrides).length} field{Object.keys(overrides).length !== 1 ? 's' : ''} overridden
              </span>
            )}
            <Button onClick={() => onConfirm(context)} disabled={loading}>
              {loading ? 'Generating...' : 'Confirm & Generate'}
            </Button>
          </div>
        </div>
      </div>
  );
}
