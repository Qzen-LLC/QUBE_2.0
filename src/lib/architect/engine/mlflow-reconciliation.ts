import type {
  MLflowRegisteredModel,
  MLflowDiscoveryResult,
  MLflowSyncOutput,
  GovernanceStatus,
} from "../models/production";

interface UseCaseRef {
  id: string;
  title: string;
}

/**
 * Tokenize a string into lowercase words for comparison.
 */
function tokenize(str: string): Set<string> {
  return new Set(
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
  );
}

/**
 * Jaccard similarity between two sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Try to match a model to a use case using the priority-based matching strategy.
 * Returns { useCaseId, confidence, method } or null if no match.
 */
function matchModel(
  model: MLflowRegisteredModel,
  useCases: UseCaseRef[]
): { useCaseId: string; confidence: number; method: string } | null {
  // 1. Tag match — highest priority
  const tagId =
    model.tags["qube_use_case_id"] || model.tags["use_case_id"];
  if (tagId) {
    const matched = useCases.find((uc) => uc.id === tagId);
    if (matched) {
      return { useCaseId: matched.id, confidence: 1.0, method: "tag" };
    }
  }

  // 2. Exact name match (case-insensitive)
  const modelNameLower = model.name.toLowerCase();
  for (const uc of useCases) {
    if (uc.title.toLowerCase() === modelNameLower) {
      return { useCaseId: uc.id, confidence: 0.95, method: "exact_name" };
    }
  }

  // 3. Fuzzy match — Jaccard similarity on tokenized words
  const modelTokens = tokenize(model.name);
  let bestMatch: { useCaseId: string; confidence: number } | null = null;

  for (const uc of useCases) {
    const ucTokens = tokenize(uc.title);
    const similarity = jaccardSimilarity(modelTokens, ucTokens);
    if (similarity >= 0.4 && (!bestMatch || similarity > bestMatch.confidence)) {
      bestMatch = { useCaseId: uc.id, confidence: Math.round(similarity * 100) / 100 };
    }
  }

  if (bestMatch) {
    return { ...bestMatch, method: "fuzzy" };
  }

  return null;
}

function assignGovernanceStatus(confidence: number | null): GovernanceStatus {
  if (confidence === null) return "ungoverned";
  if (confidence >= 0.8) return "governed";
  if (confidence >= 0.4) return "review_needed";
  return "ungoverned";
}

/**
 * Reconcile a list of MLflow registered models against QUBE use cases.
 */
export function reconcileModelsWithUseCases(
  models: MLflowRegisteredModel[],
  useCases: UseCaseRef[]
): MLflowSyncOutput {
  const results: MLflowDiscoveryResult[] = [];
  let governedCount = 0;
  let ungovernedCount = 0;
  let reviewNeededCount = 0;

  for (const model of models) {
    const match = matchModel(model, useCases);
    const governanceStatus = assignGovernanceStatus(match?.confidence ?? null);

    // Determine latest version/stage from the model's versions
    const prodVersion = model.latestVersions.find(
      (v) => v.stage === "Production"
    );
    const latestVer = prodVersion || model.latestVersions[0];

    const result: MLflowDiscoveryResult = {
      modelName: model.name,
      description: model.description,
      latestVersion: latestVer?.version ?? null,
      stage: latestVer?.stage ?? "None",
      tags: model.tags,
      aliases: model.aliases,
      source: latestVer?.source ?? null,
      mlflowCreatedAt: model.creationTimestamp
        ? new Date(model.creationTimestamp).toISOString()
        : null,
      mlflowUpdatedAt: model.lastUpdatedTimestamp
        ? new Date(model.lastUpdatedTimestamp).toISOString()
        : null,
      matchedUseCaseId: match?.useCaseId ?? null,
      matchConfidence: match?.confidence ?? null,
      matchMethod: match?.method ?? null,
      governanceStatus,
    };

    results.push(result);

    if (governanceStatus === "governed") governedCount++;
    else if (governanceStatus === "ungoverned") ungovernedCount++;
    else reviewNeededCount++;
  }

  return {
    totalModels: results.length,
    governedCount,
    ungovernedCount,
    reviewNeededCount,
    models: results,
    syncedAt: new Date().toISOString(),
  };
}
