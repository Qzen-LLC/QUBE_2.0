import { NextResponse } from "next/server";
import { prismaClient } from "@/utils/db";
import { fetchRegisteredModels, reconcileModelsWithUseCases } from "@/lib/architect";

/**
 * Scheduled MLflow auto-reconciliation endpoint.
 * Triggered by Cloud Scheduler or external cron.
 * Authenticated via INTERNAL_API_TOKEN (machine-to-machine, not JWT).
 */
export async function POST(request: Request) {
  // Verify internal token
  const token = process.env.INTERNAL_API_TOKEN;
  const authHeader = request.headers.get("authorization");
  if (token && authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all configs with MLflow enabled and auto-reconcile on
    const configs = await prismaClient.productionConfiguration.findMany({
      where: {
        mlflowEnabled: true,
        autoReconcile: true,
      },
      select: {
        id: true,
        useCaseId: true,
        mlflowTrackingUrl: true,
        mlflowAuthUsername: true,
        mlflowAuthPassword: true,
        reconcileFrequency: true,
      },
    });

    if (configs.length === 0) {
      return NextResponse.json({
        message: "No configurations with MLflow auto-reconcile enabled",
        synced: 0,
      });
    }

    // Frequency gate
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const dayOfMonth = now.getDate();

    // Fetch all use cases once for matching
    const useCases = await prismaClient.useCase.findMany({
      select: { id: true, title: true },
    });

    const results: Array<{ configId: string; status: string; modelCount?: number; error?: string }> = [];

    for (const config of configs) {
      // Check frequency
      const freq = config.reconcileFrequency || "weekly";
      if (freq === "weekly" && dayOfWeek !== 1) continue; // Monday only
      if (freq === "monthly" && dayOfMonth !== 1) continue; // 1st of month only

      if (!config.mlflowTrackingUrl) {
        results.push({ configId: config.id, status: "skipped", error: "No tracking URL" });
        continue;
      }

      try {
        const options = {
          trackingUrl: config.mlflowTrackingUrl,
          authUsername: config.mlflowAuthUsername,
          authPassword: config.mlflowAuthPassword,
        };

        // Fetch models from MLflow
        const mlflowModels = await fetchRegisteredModels(options);

        // Reconcile against use cases
        const syncOutput = reconcileModelsWithUseCases(mlflowModels, useCases);

        // Upsert discovered models
        const syncedAt = new Date();
        for (const model of syncOutput.models) {
          await prismaClient.mlflowDiscoveredModel.upsert({
            where: {
              modelName_stage: {
                modelName: model.modelName,
                stage: model.stage ?? "None",
              },
            },
            create: {
              modelName: model.modelName,
              description: model.description,
              latestVersion: model.latestVersion,
              stage: model.stage ?? "None",
              tags: model.tags ?? {},
              aliases: model.aliases ?? {},
              source: model.source,
              mlflowCreatedAt: model.mlflowCreatedAt ? new Date(model.mlflowCreatedAt) : null,
              mlflowUpdatedAt: model.mlflowUpdatedAt ? new Date(model.mlflowUpdatedAt) : null,
              matchedUseCaseId: model.matchedUseCaseId,
              matchConfidence: model.matchConfidence,
              matchMethod: model.matchMethod,
              governanceStatus: model.governanceStatus,
              syncedAt,
            },
            update: {
              description: model.description,
              latestVersion: model.latestVersion,
              tags: model.tags ?? {},
              aliases: model.aliases ?? {},
              source: model.source,
              mlflowCreatedAt: model.mlflowCreatedAt ? new Date(model.mlflowCreatedAt) : null,
              mlflowUpdatedAt: model.mlflowUpdatedAt ? new Date(model.mlflowUpdatedAt) : null,
              matchedUseCaseId: model.matchedUseCaseId,
              matchConfidence: model.matchConfidence,
              matchMethod: model.matchMethod,
              governanceStatus: model.governanceStatus,
              syncedAt,
            },
          });
        }

        results.push({
          configId: config.id,
          status: "synced",
          modelCount: syncOutput.totalModels,
        });
      } catch (err) {
        results.push({
          configId: config.id,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      message: "MLflow auto-reconciliation complete",
      synced: results.filter((r) => r.status === "synced").length,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error("MLflow auto-reconcile error:", error);
    return NextResponse.json(
      { error: "MLflow auto-reconciliation failed", detail: String(error) },
      { status: 500 }
    );
  }
}
