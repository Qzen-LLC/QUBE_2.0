import type { MLflowRegisteredModel, MLflowModelVersion } from "../models/production";

export interface MLflowConnectionOptions {
  trackingUrl: string;
  authUsername?: string | null;
  authPassword?: string | null;
}

function apiUrl(base: string, path: string): string {
  const cleanBase = base.replace(/\/+$/, "");
  return `${cleanBase}/api/2.0/mlflow/${path}`;
}

function buildHeaders(options: MLflowConnectionOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.authUsername && options.authPassword) {
    const credentials = Buffer.from(
      `${options.authUsername}:${options.authPassword}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  }
  return headers;
}

function tagsArrayToRecord(
  tags?: Array<{ key: string; value: string }> | null
): Record<string, string> {
  if (!tags || !Array.isArray(tags)) return {};
  const result: Record<string, string> = {};
  for (const tag of tags) {
    result[tag.key] = tag.value;
  }
  return result;
}

function aliasesToRecord(
  aliases?: Array<{ alias: string; version: string }> | null
): Record<string, string> {
  if (!aliases || !Array.isArray(aliases)) return {};
  const result: Record<string, string> = {};
  for (const a of aliases) {
    result[a.alias] = a.version;
  }
  return result;
}

function mapVersion(raw: Record<string, unknown>): MLflowModelVersion {
  return {
    name: (raw.name as string) || "",
    version: String(raw.version ?? "1"),
    stage: (raw.current_stage as string) || (raw.stage as string) || "None",
    description: (raw.description as string) || null,
    source: (raw.source as string) || null,
    tags: tagsArrayToRecord(
      raw.tags as Array<{ key: string; value: string }> | null
    ),
    creationTimestamp: raw.creation_timestamp
      ? Number(raw.creation_timestamp)
      : null,
  };
}

/**
 * Check if an MLflow tracking server is reachable.
 */
export async function isMLflowAvailable(
  options: MLflowConnectionOptions
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      apiUrl(options.trackingUrl, "registered-models/search?max_results=1"),
      {
        method: "GET",
        headers: buildHeaders(options),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch all registered models from MLflow, handling pagination.
 */
export async function fetchRegisteredModels(
  options: MLflowConnectionOptions
): Promise<MLflowRegisteredModel[]> {
  const allModels: MLflowRegisteredModel[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ max_results: "100" });
    if (pageToken) params.set("page_token", pageToken);

    const res = await fetch(
      apiUrl(options.trackingUrl, `registered-models/search?${params}`),
      { headers: buildHeaders(options) }
    );

    if (!res.ok) {
      throw new Error(`MLflow API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as {
      registered_models?: Array<Record<string, unknown>>;
      next_page_token?: string;
    };

    const models = data.registered_models ?? [];
    for (const raw of models) {
      const latestVersions = Array.isArray(raw.latest_versions)
        ? (raw.latest_versions as Array<Record<string, unknown>>).map(mapVersion)
        : [];

      allModels.push({
        name: (raw.name as string) || "",
        description: (raw.description as string) || null,
        tags: tagsArrayToRecord(
          raw.tags as Array<{ key: string; value: string }> | null
        ),
        aliases: aliasesToRecord(
          raw.aliases as Array<{ alias: string; version: string }> | null
        ),
        creationTimestamp: raw.creation_timestamp
          ? Number(raw.creation_timestamp)
          : null,
        lastUpdatedTimestamp: raw.last_updated_timestamp
          ? Number(raw.last_updated_timestamp)
          : null,
        latestVersions,
      });
    }

    pageToken = data.next_page_token || undefined;
  } while (pageToken);

  return allModels;
}

/**
 * Fetch the latest versions of a specific model.
 */
export async function fetchLatestVersions(
  options: MLflowConnectionOptions,
  modelName: string
): Promise<MLflowModelVersion[]> {
  const res = await fetch(
    apiUrl(options.trackingUrl, "registered-models/get-latest-versions"),
    {
      method: "POST",
      headers: buildHeaders(options),
      body: JSON.stringify({ name: modelName }),
    }
  );

  if (!res.ok) {
    throw new Error(`MLflow API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    model_versions?: Array<Record<string, unknown>>;
  };

  return (data.model_versions ?? []).map(mapVersion);
}
