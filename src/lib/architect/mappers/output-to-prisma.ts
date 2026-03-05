import type { ArchitectureOutput } from "../models/outputs";

interface PrismaRiskCreate {
  useCaseId: string;
  category: string;
  riskLevel: string;
  riskScore: number;
  title: string;
  description: string;
  impact: string;
  likelihood: string;
  mitigationPlan: string;
  sourceType: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
}

interface PrismaThreatCreate {
  useCaseId: string;
  title: string;
  description: string;
  category: string;
  framework: string;
  severity: string;
  severityScore: number;
  likelihood: string;
  attackVector: string;
  mitigationPlan: string;
  sourceType: string;
}

interface PrismaGuardrailCreate {
  useCaseId: string;
  name: string;
  description: string;
  approach: string;
  configuration: Record<string, unknown>;
  reasoning: Record<string, unknown>;
  confidence: number;
  status: string;
}

interface PrismaGuardrailRuleCreate {
  type: string;
  severity: string;
  rule: string;
  description: string;
  rationale: string;
  implementation: Record<string, unknown>;
}

interface PrismaFinOpsUpdate {
  apiCostBase: number;
  infraCostBase: number;
  opCostBase: number;
  source: string;
}

const SEVERITY_SCORES: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function mapRisks(
  output: ArchitectureOutput,
  useCaseId: string
): PrismaRiskCreate[] {
  return output.risk.risks.map((r) => ({
    useCaseId,
    category: r.category,
    riskLevel: r.severity.charAt(0).toUpperCase() + r.severity.slice(1),
    riskScore: SEVERITY_SCORES[r.severity.toLowerCase()] ?? 2,
    title: r.name,
    description: r.description,
    impact: r.impact.charAt(0).toUpperCase() + r.impact.slice(1),
    likelihood:
      r.probability.charAt(0).toUpperCase() + r.probability.slice(1),
    mitigationPlan: r.mitigation,
    sourceType: "architect-pipeline",
    createdBy: "system",
    createdByName: "Architect Pipeline",
    createdByEmail: "system@qube.ai",
  }));
}

export function mapThreats(
  output: ArchitectureOutput,
  useCaseId: string
): PrismaThreatCreate[] {
  return output.threat.threats.map((t) => ({
    useCaseId,
    title: t.threatName,
    description: t.description,
    category: t.strideCategory,
    framework: "STRIDE",
    severity: t.severity.charAt(0).toUpperCase() + t.severity.slice(1),
    severityScore: SEVERITY_SCORES[t.severity.toLowerCase()] ?? 2,
    likelihood: "Medium",
    attackVector: t.attackVector,
    mitigationPlan: t.recommendedControls.join("; "),
    sourceType: "architect-pipeline",
  }));
}

export function mapGuardrails(
  output: ArchitectureOutput,
  useCaseId: string
): {
  guardrail: PrismaGuardrailCreate;
  rules: PrismaGuardrailRuleCreate[];
} {
  const rules: PrismaGuardrailRuleCreate[] = output.guardrails.guardrails.map(
    (g) => ({
      type: g.layer,
      severity:
        g.priority === "must_have"
          ? "CRITICAL"
          : g.priority === "should_have"
            ? "HIGH"
            : "MEDIUM",
      rule: g.name,
      description: g.description,
      rationale: g.implementationGuidance,
      implementation: {
        guidance: g.implementationGuidance,
        sourceThreatIds: g.sourceThreatIds,
        sourcePillar: g.sourcePillar,
      },
    })
  );

  const guardrail: PrismaGuardrailCreate = {
    useCaseId,
    name: `Architect Pipeline Guardrails - ${output.useCaseName}`,
    description: output.guardrails.narrative,
    approach: "architect-pipeline",
    configuration: {
      coverageScore: output.guardrails.coverageScore,
      evalMetrics: output.guardrails.evalMetrics,
    },
    reasoning: {
      threatCount: output.threat.totalThreats,
      guardrailCount: output.guardrails.guardrails.length,
    },
    confidence: output.guardrails.coverageScore / 100,
    status: "draft",
  };

  return { guardrail, rules };
}

export function mapFinOps(output: ArchitectureOutput): PrismaFinOpsUpdate {
  const llmCost =
    output.finops.lineItems.find((li) => li.category === "llm_inference")
      ?.monthlyCostMid ?? 0;
  const infraCost =
    output.finops.lineItems.find((li) => li.category === "infrastructure")
      ?.monthlyCostMid ?? 0;
  const otherCosts = output.finops.lineItems
    .filter(
      (li) =>
        li.category !== "llm_inference" && li.category !== "infrastructure"
    )
    .reduce((s, li) => s + li.monthlyCostMid, 0);

  return {
    apiCostBase: llmCost,
    infraCostBase: infraCost,
    opCostBase: otherCosts,
    source: "architect-pipeline",
  };
}
