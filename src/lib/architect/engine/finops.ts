import { callLLM } from "./llm-client";
import type { EnrichedContext } from "../models/context";
import type {
  FinOpsOutput,
  CostLineItem,
  FinOpsProjection,
} from "../models/outputs";
import pricingData from "../patterns/pricing.json";

const pricing = pricingData as Record<string, unknown>;

function calcLlmCosts(ctx: EnrichedContext): CostLineItem {
  const daily = ctx.business.dailyRequests;
  const avgIn = ctx.business.avgInputTokens;
  const avgOut = ctx.business.avgOutputTokens;

  const llmComp = ctx.technical.components.find((c) => c.type === "llm");
  let inPrice: number;
  let outPrice: number;
  let modelName: string;

  if (llmComp?.pricing.inputPerMtok) {
    inPrice = llmComp.pricing.inputPerMtok;
    outPrice = llmComp.pricing.outputPerMtok ?? inPrice * 3;
    modelName = llmComp.modelOrService;
  } else {
    modelName = "claude-sonnet-4-5";
    const llmModels = pricing.llm_models as Record<string, Record<string, number>>;
    const cat = llmModels[modelName] ?? {};
    inPrice = cat.input_per_mtok ?? 3.0;
    outPrice = cat.output_per_mtok ?? 15.0;
  }

  const monthlyRequests = daily * 30;
  const monthlyInputTokens = monthlyRequests * avgIn;
  const monthlyOutputTokens = monthlyRequests * avgOut;

  const costMid =
    (monthlyInputTokens * inPrice) / 1_000_000 +
    (monthlyOutputTokens * outPrice) / 1_000_000;

  const guardrailMultiplier = 1.15;

  return {
    category: "llm_inference",
    description: `LLM inference (${modelName}): ${monthlyRequests.toLocaleString()} requests/month, avg ${avgIn} input + ${avgOut} output tokens`,
    monthlyCostLow: costMid * 0.7,
    monthlyCostMid: costMid * guardrailMultiplier,
    monthlyCostHigh: costMid * 1.5,
    unit: "USD/month",
    calculationBasis: `(${monthlyInputTokens.toLocaleString()} input tokens x $${inPrice}/Mtok + ${monthlyOutputTokens.toLocaleString()} output tokens x $${outPrice}/Mtok) x 30 days x ${guardrailMultiplier}x guardrail overhead`,
    sourcePillar: "technical + business",
  };
}

function calcEmbeddingCosts(ctx: EnrichedContext): CostLineItem | null {
  const embedComp = ctx.technical.components.find(
    (c) => c.type === "embedding_model"
  );
  if (!embedComp) return null;

  const corpusSize = ctx.dataReadiness.corpusDocumentCount ?? 10000;
  const avgDocTokens = 500;
  const dailyQueries = ctx.business.dailyRequests;
  const avgQueryTokens = 100;

  const modelName = embedComp.modelOrService;
  const embeddingModels = pricing.embedding_models as Record<string, Record<string, number>>;
  const cat = embeddingModels[modelName] ?? {};
  const perMtok = cat.per_mtok ?? 0.02;

  const indexTokens = corpusSize * avgDocTokens;

  const monthlyQueryTokens = dailyQueries * 30 * avgQueryTokens;
  const monthlyCost = (monthlyQueryTokens * perMtok) / 1_000_000;
  const monthlyReindex = (indexTokens * 0.1 * perMtok) / 1_000_000;

  const totalMonthly = monthlyCost + monthlyReindex;

  return {
    category: "embedding",
    description: `Embedding (${modelName}): query embeddings + monthly re-indexing of ${corpusSize.toLocaleString()} docs`,
    monthlyCostLow: totalMonthly * 0.8,
    monthlyCostMid: totalMonthly,
    monthlyCostHigh: totalMonthly * 1.5,
    unit: "USD/month",
    calculationBasis: `Query: ${(dailyQueries * 30).toLocaleString()} queries x ${avgQueryTokens} tokens x $${perMtok}/Mtok + Re-index: ${corpusSize.toLocaleString()} x ${avgDocTokens} tokens x 10% churn x $${perMtok}/Mtok`,
    sourcePillar: "technical + data_readiness",
  };
}

function calcVectorStoreCosts(ctx: EnrichedContext): CostLineItem | null {
  const vecComp = ctx.technical.components.find(
    (c) => c.type === "vector_store"
  );
  if (!vecComp) return null;

  const corpusSize = ctx.dataReadiness.corpusDocumentCount ?? 10000;
  const totalVectors = corpusSize * 3;
  const storageGb = totalVectors * 0.001;

  const provider = vecComp.provider;
  const service = vecComp.modelOrService;

  let monthlyCost: number;
  if (provider.toLowerCase().includes("pinecone")) {
    monthlyCost =
      storageGb * 0.33 +
      ((ctx.business.dailyRequests * 30) / 1_000_000) * 8.25;
  } else if (
    provider.toLowerCase().includes("pgvector") ||
    service.toLowerCase().includes("postgresql")
  ) {
    monthlyCost = 200;
  } else {
    monthlyCost = 100;
  }

  return {
    category: "vector_storage",
    description: `Vector store (${provider}/${service}): ${totalVectors.toLocaleString()} vectors, ${storageGb.toFixed(1)} GB`,
    monthlyCostLow: monthlyCost * 0.8,
    monthlyCostMid: monthlyCost,
    monthlyCostHigh: monthlyCost * 1.3,
    unit: "USD/month",
    calculationBasis: `${corpusSize.toLocaleString()} docs x 3 chunks x ~1KB = ${storageGb.toFixed(1)} GB + read costs for ${(ctx.business.dailyRequests * 30).toLocaleString()} monthly queries`,
    sourcePillar: "technical + data_readiness",
  };
}

function calcInfrastructureCosts(ctx: EnrichedContext): CostLineItem {
  let baseCompute = 150;
  const daily = ctx.business.dailyRequests;

  if (daily > 10000) baseCompute += 200;
  if (daily > 50000) baseCompute += 400;
  if (daily > 100000) baseCompute += 800;

  const topology = ctx.technical.topology;
  if (topology.includes("multi-az")) {
    baseCompute *= 1.5;
  } else if (topology.includes("multi-region")) {
    baseCompute *= 2.5;
  }

  let monitoring = 50;
  if (ctx.legal.auditRequired) monitoring += 100;

  const total = baseCompute + monitoring;

  return {
    category: "infrastructure",
    description: `Infrastructure: compute (${ctx.technical.deploymentTarget}), networking, monitoring (${topology})`,
    monthlyCostLow: total * 0.7,
    monthlyCostMid: total,
    monthlyCostHigh: total * 1.5,
    unit: "USD/month",
    calculationBasis: `Base compute $${baseCompute.toFixed(0)} (scaled for ${daily.toLocaleString()} daily requests, ${topology}) + monitoring $${monitoring.toFixed(0)}`,
    sourcePillar: "technical + legal",
  };
}

function calcDataPrepCosts(ctx: EnrichedContext): CostLineItem | null {
  if (
    (ctx.dataReadiness.qualityScore === "high" ||
      ctx.dataReadiness.qualityScore === "medium") &&
    ctx.dataReadiness.goldenDatasetExists
  ) {
    return null;
  }

  const corpus = ctx.dataReadiness.corpusDocumentCount ?? 10000;
  let prepCost: number;

  if (!ctx.dataReadiness.goldenDatasetExists) {
    prepCost = corpus * 0.1;
  } else if (
    ctx.dataReadiness.qualityScore === "low" ||
    ctx.dataReadiness.qualityScore === "unknown"
  ) {
    prepCost = corpus * 0.05;
  } else {
    return null;
  }

  return {
    category: "data_preparation",
    description: `Data preparation: ${!ctx.dataReadiness.goldenDatasetExists ? "golden dataset creation" : "quality improvement"} for ${corpus.toLocaleString()} documents`,
    monthlyCostLow: 0,
    monthlyCostMid: 0,
    monthlyCostHigh: 0,
    unit: "USD (one-time)",
    calculationBasis: `${corpus.toLocaleString()} documents x estimated prep cost per doc ($${prepCost.toFixed(0)} total). This is a prerequisite one-time cost.`,
    sourcePillar: "data_readiness",
  };
}

function calcObservabilityCosts(ctx: EnrichedContext): CostLineItem | null {
  if (!ctx.dataReadiness.observabilityRequired) return null;

  const monthlyCost =
    ctx.dataReadiness.observabilityCostEstimateUsdMonthly ??
    (ctx.business.dailyRequests > 10000 ? 300 : ctx.business.dailyRequests > 1000 ? 150 : 50);

  return {
    category: "observability",
    description: `Observability: logging, tracing, and monitoring (${ctx.responsible.evalPlatformHint ?? "custom"})`,
    monthlyCostLow: monthlyCost * 0.7,
    monthlyCostMid: monthlyCost,
    monthlyCostHigh: monthlyCost * 1.3,
    unit: "USD/month",
    calculationBasis: `Observability platform costs for ${(ctx.business.dailyRequests * 30).toLocaleString()} monthly requests with trace retention`,
    sourcePillar: "data_readiness + responsible",
  };
}

function calcComplianceCosts(ctx: EnrichedContext): { monthly: CostLineItem | null; oneTime: CostLineItem | null } {
  const estimate = ctx.legal.complianceCostEstimateUsd;
  if (!estimate) return { monthly: null, oneTime: null };

  const monthlyItem: CostLineItem | null = estimate.annual
    ? {
        category: "compliance",
        description: `Compliance: annual regulatory maintenance (${ctx.legal.euAiActRiskCategory ?? "standard"})`,
        monthlyCostLow: (estimate.annual / 12) * 0.8,
        monthlyCostMid: estimate.annual / 12,
        monthlyCostHigh: (estimate.annual / 12) * 1.3,
        unit: "USD/month",
        calculationBasis: `Annual compliance cost $${estimate.annual.toLocaleString()} / 12 months`,
        sourcePillar: "legal",
      }
    : null;

  const oneTimeItem: CostLineItem | null = estimate.setup
    ? {
        category: "compliance_setup",
        description: `Compliance setup: initial certification and audit preparation`,
        monthlyCostLow: 0,
        monthlyCostMid: 0,
        monthlyCostHigh: 0,
        unit: "USD (one-time)",
        calculationBasis: `One-time compliance setup cost: $${estimate.setup.toLocaleString()}`,
        sourcePillar: "legal",
      }
    : null;

  return { monthly: monthlyItem, oneTime: oneTimeItem };
}

async function generateNarrative(
  ctx: EnrichedContext,
  lineItems: CostLineItem[],
  totalMid: number
): Promise<string> {
  const itemsSummary = lineItems
    .map(
      (li) =>
        `- ${li.category}: $${li.monthlyCostMid.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month (${li.calculationBasis})`
    )
    .join("\n");

  const growthFactor = ctx.business.scalingProfile === "flat"
    ? 1.0
    : ctx.business.scalingProfile === "exponential"
    ? Math.pow(1 + ctx.business.growthRateMonthly * 1.5, 12)
    : Math.pow(1 + ctx.business.growthRateMonthly, 12);

  const projected12m = totalMid * growthFactor;

  const budgetNote = ctx.business.budgetCeilingUsdMonthly
    ? `\nBudget ceiling: $${ctx.business.budgetCeilingUsdMonthly.toLocaleString()}/month${totalMid > ctx.business.budgetCeilingUsdMonthly ? " — WARNING: estimate exceeds budget" : ""}`
    : "";

  const alternativesNote = ctx.business.modelAlternativeCostDelta?.length
    ? `\nModel alternatives: ${ctx.business.modelAlternativeCostDelta.map((a) => `${a.model ?? "unknown"} (${a.savingsPercent ?? 0}% savings)`).join(", ")}`
    : "";

  const prompt = `Write a 2-paragraph FinOps narrative for this Gen AI use case.

Use case: ${ctx.useCaseName}
Archetype: ${ctx.archetype}
Total estimated monthly cost: $${totalMid.toLocaleString(undefined, { maximumFractionDigits: 0 })}

Cost breakdown:
${itemsSummary}

Growth rate: ${(ctx.business.growthRateMonthly * 100).toFixed(0)}% monthly (${ctx.business.scalingProfile ?? "linear"} profile)
12-month projected cost: $${projected12m.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month${budgetNote}${alternativesNote}

Focus on: key cost drivers, scaling implications, and optimization opportunities.
Keep it under 150 words. Be direct and specific.`;

  return callLLM(prompt, { maxTokens: 512, system: undefined });
}

export async function generateFinOps(
  ctx: EnrichedContext
): Promise<FinOpsOutput> {
  const lineItems: CostLineItem[] = [];

  lineItems.push(calcLlmCosts(ctx));

  const embedCosts = calcEmbeddingCosts(ctx);
  if (embedCosts) lineItems.push(embedCosts);

  const vecCosts = calcVectorStoreCosts(ctx);
  if (vecCosts) lineItems.push(vecCosts);

  lineItems.push(calcInfrastructureCosts(ctx));

  // New: observability costs
  const obsCosts = calcObservabilityCosts(ctx);
  if (obsCosts) lineItems.push(obsCosts);

  // New: compliance costs
  const complianceCosts = calcComplianceCosts(ctx);
  if (complianceCosts.monthly) lineItems.push(complianceCosts.monthly);

  const oneTime: CostLineItem[] = [];
  const dataPrep = calcDataPrepCosts(ctx);
  if (dataPrep) oneTime.push(dataPrep);
  if (complianceCosts.oneTime) oneTime.push(complianceCosts.oneTime);

  const totalLow = lineItems.reduce((s, li) => s + li.monthlyCostLow, 0);
  const totalMid = lineItems.reduce((s, li) => s + li.monthlyCostMid, 0);
  const totalHigh = lineItems.reduce((s, li) => s + li.monthlyCostHigh, 0);

  // Use scaling profile to determine growth factor
  const growth = ctx.business.growthRateMonthly;
  const projections: FinOpsProjection[] = [];
  for (let month = 1; month <= 12; month++) {
    let factor: number;
    if (ctx.business.scalingProfile === "flat") {
      factor = 1.0;
    } else if (ctx.business.scalingProfile === "exponential") {
      factor = Math.pow(1 + growth * 1.5, month - 1);
    } else {
      factor = Math.pow(1 + growth, month - 1);
    }
    projections.push({
      month,
      totalLow: totalLow * factor,
      totalMid: totalMid * factor,
      totalHigh: totalHigh * factor,
    });
  }

  const pricingMeta = pricing as Record<string, unknown>;
  const assumptions = [
    `Pricing as of ${(pricingMeta.last_updated as string) ?? "latest"}`,
    `Monthly growth rate: ${(growth * 100).toFixed(0)}% (${ctx.business.scalingProfile ?? "linear"} scaling profile)`,
    `Average request: ${ctx.business.avgInputTokens} input + ${ctx.business.avgOutputTokens} output tokens`,
    "Guardrail overhead: ~15% additional inference cost",
    "Vector store chunk ratio: ~3 chunks per document",
  ];
  if (
    ctx.dataReadiness.qualityScore === "low" ||
    ctx.dataReadiness.qualityScore === "unknown"
  ) {
    assumptions.push(
      "Data preparation costs are one-time and not included in monthly run rate"
    );
  }
  // New: budget ceiling comparison
  if (ctx.business.budgetCeilingUsdMonthly) {
    if (totalMid > ctx.business.budgetCeilingUsdMonthly) {
      assumptions.push(
        `WARNING: Estimated mid-range cost ($${totalMid.toLocaleString(undefined, { maximumFractionDigits: 0 })}) exceeds budget ceiling ($${ctx.business.budgetCeilingUsdMonthly.toLocaleString()})`
      );
    } else {
      assumptions.push(
        `Budget ceiling: $${ctx.business.budgetCeilingUsdMonthly.toLocaleString()}/month — estimate is within budget`
      );
    }
  }
  // New: model alternatives
  if (ctx.business.modelAlternativeCostDelta?.length) {
    for (const alt of ctx.business.modelAlternativeCostDelta) {
      if (alt.model && alt.savingsPercent) {
        assumptions.push(
          `Alternative: ${alt.model} could save ~${alt.savingsPercent}% on LLM inference costs`
        );
      }
    }
  }

  const narrative = await generateNarrative(ctx, lineItems, totalMid);

  // Use costExplosionRiskMultiplier instead of hardcoded 10x
  const explosionMultiplier = ctx.business.costExplosionRiskMultiplier ?? 10;
  const costUnderAttack = totalHigh * explosionMultiplier;

  return {
    summaryMonthlyLow: totalLow,
    summaryMonthlyMid: totalMid,
    summaryMonthlyHigh: totalHigh,
    lineItems,
    projections12m: projections,
    oneTimeCosts: oneTime,
    assumptions,
    dataPrepCosts: dataPrep,
    costUnderAttackScenario: costUnderAttack,
    narrative,
  };
}
