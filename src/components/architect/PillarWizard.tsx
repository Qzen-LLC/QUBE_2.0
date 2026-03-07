"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { PillarScorecard } from "./PillarScorecard";

const CATEGORIES = ["rag", "agent", "copilot", "content_generation", "code_generation", "multimodal", "fine_tuned_model", "conversational_ai"];
const MODELS = ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-5", "gpt-4o", "gpt-4o-mini", "gemini-1.5-pro", "gemini-1.5-flash"];
const DEPLOYMENTS = ["aws", "azure", "gcp", "on_prem", "hybrid"];
const IMPACTS = ["informational", "advisory", "decision_support", "autonomous"];
const OVERSIGHTS = ["none", "escalation_only", "review_before_action", "always_in_loop"];
const CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"];
const MATURITIES = ["none", "ad_hoc", "managed", "automated", "optimized"];
const REGULATIONS = ["GDPR", "HIPAA", "SOC2", "CCPA", "PCI-DSS", "FERPA", "FedRAMP", "ISO27001"];
const GOVERNANCE_FRAMEWORKS = ["EU AI Act", "ISO/IEC 42001", "ISO 27001", "UAE AI/GenAI Controls"];

export interface WizardFormData {
  name: string;
  archetypeId?: string;
  technical: Record<string, unknown>;
  business: Record<string, unknown>;
  responsible: Record<string, unknown>;
  legal: Record<string, unknown>;
  dataReadiness: Record<string, unknown>;
}

const DEFAULT_FORM: WizardFormData = {
  name: "",
  technical: {
    useCaseCategory: "rag",
    description: "",
    targetModel: "claude-sonnet-4-5",
    contextWindowNeeds: "medium",
    orchestrationComplexity: "simple",
    deploymentTarget: "aws",
    toolUseRequired: false,
    multiModal: false,
  },
  business: {
    businessOutcome: "",
    targetUsers: "",
    isCustomerFacing: false,
    growthRateMonthly: 0.05,
  },
  responsible: {
    decisionImpact: "advisory",
    humanOversight: "escalation_only",
    explainabilityRequired: false,
  },
  legal: {
    regulations: [],
    governanceFrameworks: [],
    dataClassification: "internal",
    piiPresent: false,
    phiPresent: false,
    auditRequired: false,
    crossBorderDataFlows: false,
  },
  dataReadiness: {
    dataSources: [],
    dataQualityScore: "unknown",
    goldenDatasetExists: false,
    pipelineMaturity: "none",
  },
};

const STEP_LABELS = [
  "Archetype",
  "Technical",
  "Business",
  "Responsible",
  "Legal",
  "Data Readiness",
  "Review",
];

const PILLAR_COLORS: Record<number, string> = {
  1: "bg-blue-600/20 text-blue-600 dark:text-blue-400",
  2: "bg-emerald-600/20 text-emerald-600 dark:text-emerald-400",
  3: "bg-violet-600/20 text-violet-600 dark:text-violet-400",
  4: "bg-amber-600/20 text-amber-600 dark:text-amber-400",
  5: "bg-cyan-600/20 text-cyan-600 dark:text-cyan-400",
};

// Helper components defined outside PillarWizard to prevent re-mount on state changes
function SelectField({ label, value, onChange, options, hint }: {
  label: string; value: unknown; onChange: (v: string) => void; options: string[] | { value: string; label: string }[]; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="dark:text-gray-300">{label}</Label>
      <select
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
      >
        {options.map((o) => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o.replace(/_/g, " ") : o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function MultiSelectField({ label, selected, options, onChange }: {
  label: string; selected: string[]; options: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="dark:text-gray-300">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() =>
              onChange(
                selected.includes(o) ? selected.filter((v) => v !== o) : [...selected, o]
              )
            }
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              selected.includes(o)
                ? "bg-blue-100 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-300"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 dark:bg-gray-900 dark:border-gray-800 space-y-4">
      <h3 className="text-base font-semibold dark:text-white">{title}</h3>
      {children}
    </Card>
  );
}

interface PillarWizardProps {
  onGenerate: (formData: WizardFormData, draftId?: string) => void;
  onScorePillars: (formData: WizardFormData) => Promise<Record<string, unknown>>;
  loading: boolean;
  initialData?: Partial<WizardFormData>;
  /** Start at a specific step (0=Archetype, 1=Technical, etc.). Defaults to 0. */
  startStep?: number;
  /** Existing draft use case ID for DB persistence. */
  draftId?: string;
  /** Callback when a new draft is created or ID changes. */
  onDraftIdChange?: (id: string) => void;
}

export function PillarWizard({
  onGenerate,
  onScorePillars,
  loading,
  initialData,
  startStep = 0,
  draftId: initialDraftId,
  onDraftIdChange,
}: PillarWizardProps) {
  const DRAFT_KEY = "qube-wizard-draft";
  const DRAFT_STEP_KEY = "qube-wizard-step";

  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return startStep;
    const saved = localStorage.getItem(DRAFT_STEP_KEY);
    return saved ? Math.min(Number(saved), startStep || 6) : startStep;
  });
  const [formData, setFormData] = useState<WizardFormData>(() => {
    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as WizardFormData;
          return {
            ...DEFAULT_FORM,
            ...parsed,
            ...initialData,
            technical: { ...DEFAULT_FORM.technical, ...parsed.technical, ...initialData?.technical },
            business: { ...DEFAULT_FORM.business, ...parsed.business, ...initialData?.business },
            responsible: { ...DEFAULT_FORM.responsible, ...parsed.responsible, ...initialData?.responsible },
            legal: { ...DEFAULT_FORM.legal, ...parsed.legal, ...initialData?.legal },
            dataReadiness: { ...DEFAULT_FORM.dataReadiness, ...parsed.dataReadiness, ...initialData?.dataReadiness },
          };
        } catch { /* ignore corrupted data */ }
      }
    }
    return {
      ...DEFAULT_FORM,
      ...initialData,
      technical: { ...DEFAULT_FORM.technical, ...initialData?.technical },
      business: { ...DEFAULT_FORM.business, ...initialData?.business },
      responsible: { ...DEFAULT_FORM.responsible, ...initialData?.responsible },
      legal: { ...DEFAULT_FORM.legal, ...initialData?.legal },
      dataReadiness: { ...DEFAULT_FORM.dataReadiness, ...initialData?.dataReadiness },
    };
  });
  const [hasDraft, setHasDraft] = useState(() => typeof window !== "undefined" && !!localStorage.getItem(DRAFT_KEY));
  const [pillarScores, setPillarScores] = useState<Record<string, unknown> | null>(() => {
    // Restore pillar scores from localStorage or initialData
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed._pillarScores) return parsed._pillarScores;
        } catch { /* ignore */ }
      }
    }
    // Check initialData (from DB draft)
    const id = initialData as Record<string, unknown> | undefined;
    if (id?._pillarScores) return id._pillarScores as Record<string, unknown>;
    return null;
  });
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(initialDraftId);
  const [scoring, setScoring] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Debounced auto-save to DB (2s after last change)
  useEffect(() => {
    // Save to localStorage immediately (include pillar scores)
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...formData, _pillarScores: pillarScores }));
    localStorage.setItem(DRAFT_STEP_KEY, String(step));
    setHasDraft(true);

    // Debounce DB save — only if the user has entered a name
    if (!formData.name) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSavingStatus("saving");
        const res = await fetch("/api/usecase-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentDraftId,
            name: formData.name,
            wizardData: { ...formData, currentStep: step, _pillarScores: pillarScores },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!currentDraftId && data.draft?.id) {
            setCurrentDraftId(data.draft.id);
            onDraftIdChange?.(data.draft.id);
          }
          if (isMountedRef.current) setSavingStatus("saved");
          // Reset to idle after 2s
          setTimeout(() => { if (isMountedRef.current) setSavingStatus("idle"); }, 2000);
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.error("Draft save failed:", res.status, errBody);
          if (isMountedRef.current) setSavingStatus("error");
        }
      } catch (err) {
        console.error("Draft save error:", err);
        if (isMountedRef.current) setSavingStatus("error");
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formData, step, currentDraftId, onDraftIdChange, pillarScores]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(DRAFT_STEP_KEY);
    setFormData({
      ...DEFAULT_FORM,
      ...initialData,
      technical: { ...DEFAULT_FORM.technical, ...initialData?.technical },
      business: { ...DEFAULT_FORM.business, ...initialData?.business },
      responsible: { ...DEFAULT_FORM.responsible, ...initialData?.responsible },
      legal: { ...DEFAULT_FORM.legal, ...initialData?.legal },
      dataReadiness: { ...DEFAULT_FORM.dataReadiness, ...initialData?.dataReadiness },
    });
    setStep(0);
    setPillarScores(null);
    setHasDraft(false);
    setCurrentDraftId(undefined);
    setSavingStatus("idle");
  }, [initialData]);

  const updateField = useCallback(
    (pillar: string | null, field: string, value: unknown) => {
      if (!pillar) {
        setFormData((prev) => ({ ...prev, [field]: value }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [pillar]: { ...(prev[pillar as keyof WizardFormData] as Record<string, unknown>), [field]: value },
        }));
      }
    },
    []
  );

  const handleArchetypeSelect = useCallback(
    (archetype: Record<string, unknown>) => {
      const defaults = (archetype.default_pillar_values as Record<string, Record<string, unknown>>) ?? {};
      setFormData((prev) => ({
        ...prev,
        archetypeId: archetype.id as string,
        name: prev.name || (archetype.name as string),
        technical: {
          ...prev.technical,
          useCaseCategory: archetype.category as string,
          ...defaults.technical,
        },
        responsible: { ...prev.responsible, ...defaults.responsible },
        dataReadiness: { ...prev.dataReadiness, ...defaults.data_readiness },
      }));
      setStep(1);
    },
    []
  );

  const [scoringError, setScoringError] = useState<string | null>(null);

  const handleScorePillars = useCallback(async () => {
    setScoring(true);
    setScoringError(null);
    try {
      const scores = await onScorePillars(formData);
      setPillarScores(scores);
    } catch (err) {
      setScoringError(err instanceof Error ? err.message : "Scoring failed");
    } finally {
      setScoring(false);
    }
  }, [formData, onScorePillars]);

  const NavButtons = ({ hideNext }: { hideNext?: boolean }) => (
    <div className="flex justify-between items-center pt-4">
      <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step <= 0}>
        Back
      </Button>
      <div className="flex items-center gap-3">
        {saveStatusText && (
          <span className={`text-xs ${savingStatus === "error" ? "text-red-500" : "text-gray-400"}`}>
            {saveStatusText}
          </span>
        )}
        {!hideNext && (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        )}
      </div>
    </div>
  );

  // Save status indicator text
  const saveStatusText = savingStatus === "saving" ? "Saving..." :
    savingStatus === "saved" ? "Saved to cloud" :
    savingStatus === "error" ? "Save failed" : null;

  // Draft banner
  const DraftBanner = hasDraft && formData.name ? (
    <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Draft: <strong>{formData.name}</strong>
        </p>
        {saveStatusText && (
          <span className={`text-xs ${savingStatus === "error" ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
            {saveStatusText}
          </span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={clearDraft} className="text-blue-600 dark:text-blue-400 hover:text-blue-800">
        Clear draft
      </Button>
    </div>
  ) : null;

  // Step 0: Archetype
  if (step === 0) {
    return (
      <div>
        {DraftBanner}
        <ArchetypeSelector onSelect={handleArchetypeSelect} onSkip={() => setStep(1)} />
      </div>
    );
  }

  // Step 1: Technical
  if (step === 1) {
    const t = formData.technical;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${PILLAR_COLORS[1]}`}>Pillar 1</span>
          Technical &mdash; Can we build it?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Use Case Identity">
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Use Case Name</Label>
              <Input value={formData.name} onChange={(e) => updateField(null, "name", e.target.value)} placeholder="e.g., Customer Support Knowledge Bot" />
            </div>
            <SelectField label="Category" value={t.useCaseCategory} onChange={(v) => updateField("technical", "useCaseCategory", v)} options={CATEGORIES} />
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Description</Label>
              <Textarea value={(t.description as string) ?? ""} onChange={(e) => updateField("technical", "description", e.target.value)} placeholder="Describe what this AI system does..." rows={3} />
            </div>
          </SectionCard>
          <SectionCard title="Technical Specifications">
            <SelectField label="Target LLM" value={t.targetModel} onChange={(v) => updateField("technical", "targetModel", v)} options={MODELS} />
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Latency Target (ms)</Label>
              <Input type="number" value={(t.expectedLatencyMs as number) ?? ""} onChange={(e) => updateField("technical", "expectedLatencyMs", Number(e.target.value) || null)} placeholder="P95 latency target" />
            </div>
            <SelectField label="Context Window" value={t.contextWindowNeeds} onChange={(v) => updateField("technical", "contextWindowNeeds", v)} options={["small", "medium", "large"]} />
            <SelectField label="Orchestration Complexity" value={t.orchestrationComplexity} onChange={(v) => updateField("technical", "orchestrationComplexity", v)} options={["simple", "moderate", "complex"]} />
            <SelectField label="Deployment Target" value={t.deploymentTarget} onChange={(v) => updateField("technical", "deploymentTarget", v)} options={DEPLOYMENTS} />
            <div className="flex items-center justify-between">
              <Label className="dark:text-gray-300">Requires Tool Use</Label>
              <Switch checked={!!t.toolUseRequired} onCheckedChange={(v) => updateField("technical", "toolUseRequired", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="dark:text-gray-300">Multi-modal</Label>
              <Switch checked={!!t.multiModal} onCheckedChange={(v) => updateField("technical", "multiModal", v)} />
            </div>
          </SectionCard>
        </div>
        <NavButtons />
      </div>
    );
  }

  // Step 2: Business
  if (step === 2) {
    const b = formData.business;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${PILLAR_COLORS[2]}`}>Pillar 2</span>
          Business &mdash; Should we build it?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Value & Impact">
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Business Outcome</Label>
              <Textarea value={(b.businessOutcome as string) ?? ""} onChange={(e) => updateField("business", "businessOutcome", e.target.value)} placeholder="What business outcome does this enable?" rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Target Users</Label>
              <Input value={(b.targetUsers as string) ?? ""} onChange={(e) => updateField("business", "targetUsers", e.target.value)} placeholder="e.g., Customer support team" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="dark:text-gray-300">Customer Facing</Label>
              <Switch checked={!!b.isCustomerFacing} onCheckedChange={(v) => updateField("business", "isCustomerFacing", v)} />
            </div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">ROI Hypothesis</Label>
              <Textarea value={(b.roiHypothesis as string) ?? ""} onChange={(e) => updateField("business", "roiHypothesis", e.target.value)} placeholder="How does this create value?" rows={2} />
            </div>
          </SectionCard>
          <SectionCard title="Scale & Operations">
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Estimated Daily Users</Label>
              <Input type="number" value={(b.estimatedDailyUsers as number) ?? ""} onChange={(e) => updateField("business", "estimatedDailyUsers", Number(e.target.value) || null)} />
            </div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Estimated Daily Requests</Label>
              <Input type="number" value={(b.estimatedDailyRequests as number) ?? ""} onChange={(e) => updateField("business", "estimatedDailyRequests", Number(e.target.value) || null)} />
            </div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Monthly Growth Rate</Label>
              <Input type="number" value={(b.growthRateMonthly as number) ?? 0.05} onChange={(e) => updateField("business", "growthRateMonthly", Number(e.target.value))} placeholder="0.05 = 5%" step="0.01" />
            </div>
          </SectionCard>
        </div>
        <NavButtons />
      </div>
    );
  }

  // Step 3: Responsible
  if (step === 3) {
    const r = formData.responsible;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${PILLAR_COLORS[3]}`}>Pillar 3</span>
          Responsible / Ethical &mdash; Is it the right thing to do?
        </h2>
        <SectionCard title="Fairness, Transparency & Oversight">
          <div className="space-y-1">
            <Label className="dark:text-gray-300">Affected Population</Label>
            <Input value={(r.affectedPopulation as string) ?? ""} onChange={(e) => updateField("responsible", "affectedPopulation", e.target.value)} placeholder="Who is affected by this AI system?" />
          </div>
          <SelectField label="Decision Impact Level" value={r.decisionImpact} onChange={(v) => updateField("responsible", "decisionImpact", v)} options={IMPACTS} hint="How much autonomy does this AI have?" />
          <SelectField label="Human Oversight Model" value={r.humanOversight} onChange={(v) => updateField("responsible", "humanOversight", v)} options={OVERSIGHTS} />
          <div className="flex items-center justify-between">
            <Label className="dark:text-gray-300">Explainability Required</Label>
            <Switch checked={!!r.explainabilityRequired} onCheckedChange={(v) => updateField("responsible", "explainabilityRequired", v)} />
          </div>
          <div className="space-y-1">
            <Label className="dark:text-gray-300">Bias Risk Factors</Label>
            <Textarea value={(r.biasRiskFactors as string) ?? ""} onChange={(e) => updateField("responsible", "biasRiskFactors", e.target.value)} placeholder="Known bias risks in data or outcomes" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="dark:text-gray-300">Fairness Criteria</Label>
            <Textarea value={(r.fairnessCriteria as string) ?? ""} onChange={(e) => updateField("responsible", "fairnessCriteria", e.target.value)} placeholder="How is fairness defined?" rows={2} />
          </div>
        </SectionCard>
        <NavButtons />
      </div>
    );
  }

  // Step 4: Legal
  if (step === 4) {
    const l = formData.legal;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${PILLAR_COLORS[4]}`}>Pillar 4</span>
          Legal & Regulatory &mdash; Are we allowed to do it?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Compliance">
            <MultiSelectField label="Applicable Regulations" selected={(l.regulations as string[]) ?? []} options={REGULATIONS} onChange={(v) => updateField("legal", "regulations", v)} />
            <MultiSelectField label="Governance Frameworks" selected={(l.governanceFrameworks as string[]) ?? []} options={GOVERNANCE_FRAMEWORKS} onChange={(v) => updateField("legal", "governanceFrameworks", v)} />
            <SelectField label="Data Classification" value={l.dataClassification} onChange={(v) => updateField("legal", "dataClassification", v)} options={CLASSIFICATIONS} />
            <div className="flex items-center justify-between"><Label className="dark:text-gray-300">PII Present</Label><Switch checked={!!l.piiPresent} onCheckedChange={(v) => updateField("legal", "piiPresent", v)} /></div>
            <div className="flex items-center justify-between"><Label className="dark:text-gray-300">PHI Present</Label><Switch checked={!!l.phiPresent} onCheckedChange={(v) => updateField("legal", "phiPresent", v)} /></div>
            <div className="flex items-center justify-between"><Label className="dark:text-gray-300">Audit Trail Required</Label><Switch checked={!!l.auditRequired} onCheckedChange={(v) => updateField("legal", "auditRequired", v)} /></div>
          </SectionCard>
          <SectionCard title="Liability & IP">
            <div className="flex items-center justify-between"><Label className="dark:text-gray-300">Cross-Border Data Flows</Label><Switch checked={!!l.crossBorderDataFlows} onCheckedChange={(v) => updateField("legal", "crossBorderDataFlows", v)} /></div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">IP / Copyright Concerns</Label>
              <Input value={(l.ipCopyrightConcerns as string) ?? ""} onChange={(e) => updateField("legal", "ipCopyrightConcerns", e.target.value)} placeholder="e.g., open-source license compliance" />
            </div>
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Liability Model</Label>
              <Input value={(l.liabilityModel as string) ?? ""} onChange={(e) => updateField("legal", "liabilityModel", e.target.value)} placeholder="Who is liable for AI decisions?" />
            </div>
          </SectionCard>
        </div>
        <NavButtons />
      </div>
    );
  }

  // Step 5: Data Readiness
  if (step === 5) {
    const d = formData.dataReadiness;
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-3 dark:text-white">
          <span className={`px-2 py-0.5 text-xs font-bold rounded ${PILLAR_COLORS[5]}`}>Pillar 5</span>
          Data Readiness &mdash; Do we have the right data?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard title="Data Sources & Quality">
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Data Sources (one per line)</Label>
              <Textarea value={((d.dataSources as string[]) ?? []).join("\n")} onChange={(e) => updateField("dataReadiness", "dataSources", e.target.value.split("\n").filter(Boolean))} rows={4} />
            </div>
            <SelectField label="Data Quality" value={d.dataQualityScore} onChange={(v) => updateField("dataReadiness", "dataQualityScore", v)} options={["high", "medium", "low", "unknown"]} />
            <div className="space-y-1">
              <Label className="dark:text-gray-300">Corpus Document Count</Label>
              <Input type="number" value={(d.corpusDocumentCount as number) ?? ""} onChange={(e) => updateField("dataReadiness", "corpusDocumentCount", Number(e.target.value) || null)} />
            </div>
            <SelectField label="Data Freshness" value={d.dataFreshness} onChange={(v) => updateField("dataReadiness", "dataFreshness", v)} options={["real-time", "daily", "weekly", "static"]} />
          </SectionCard>
          <SectionCard title="Golden Dataset & Pipeline">
            <div className="flex items-center justify-between"><Label className="dark:text-gray-300">Golden Dataset Exists</Label><Switch checked={!!d.goldenDatasetExists} onCheckedChange={(v) => updateField("dataReadiness", "goldenDatasetExists", v)} /></div>
            {d.goldenDatasetExists && (
              <div className="space-y-1">
                <Label className="dark:text-gray-300">Golden Dataset Size</Label>
                <Input type="number" value={(d.goldenDatasetSize as number) ?? ""} onChange={(e) => updateField("dataReadiness", "goldenDatasetSize", Number(e.target.value) || null)} placeholder="Number of labeled examples" />
              </div>
            )}
            <SelectField label="Labeling Status" value={d.labelingStatus} onChange={(v) => updateField("dataReadiness", "labelingStatus", v)} options={["none", "partial", "complete"]} />
            <SelectField label="Pipeline Maturity" value={d.pipelineMaturity} onChange={(v) => updateField("dataReadiness", "pipelineMaturity", v)} options={MATURITIES} />
          </SectionCard>
        </div>
        <NavButtons />
      </div>
    );
  }

  // Step 6: Review
  if (step === 6) {
    const summaryPillars = [
      { name: "Technical", key: "technical", color: "blue", step: 1 },
      { name: "Business", key: "business", color: "emerald", step: 2 },
      { name: "Responsible", key: "responsible", color: "violet", step: 3 },
      { name: "Legal", key: "legal", color: "amber", step: 4 },
      { name: "Data", key: "dataReadiness", color: "cyan", step: 5 },
    ];

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold dark:text-white">Review & Generate</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Review your inputs, score the pillars for readiness, then generate the
          full architecture assessment.
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {summaryPillars.map((p) => {
            const data = formData[p.key as keyof WizardFormData] as Record<string, unknown>;
            const filled = Object.values(data ?? {}).filter(
              (v) => v !== "" && v !== null && v !== false && !(Array.isArray(v) && v.length === 0)
            ).length;
            return (
              <Card
                key={p.key}
                className="p-4 dark:bg-gray-900 dark:border-gray-800 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all"
                onClick={() => setStep(p.step)}
              >
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">{filled} fields provided</div>
                <div className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">Click to edit</div>
              </Card>
            );
          })}
        </div>

        {/* Score Pillars Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleScorePillars}
          disabled={loading || scoring}
        >
          {scoring ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scoring pillars...
            </span>
          ) : "Score Pillars (Preview Readiness)"}
        </Button>

        {scoringError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {scoringError}
          </div>
        )}

        {pillarScores && <PillarScorecard scores={pillarScores} />}

        {/* Generate Button */}
        <Button
          className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white"
          onClick={() => { const id = currentDraftId; clearDraft(); onGenerate(formData, id); }}
          disabled={loading}
        >
          {loading
            ? "Generating architecture assessment..."
            : "Generate Full Architecture Assessment"}
        </Button>

        <NavButtons hideNext />
      </div>
    );
  }

  return null;
}
