import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { fetchRegisteredModels, reconcileModelsWithUseCases } from "@/lib/architect";

export const POST = withAuth(async () => {
  try {
    // Read MLflow config from global production configuration
    const config = await prismaClient.productionConfiguration.findFirst({
      where: { mlflowEnabled: true },
    });

    if (!config?.mlflowTrackingUrl) {
      return NextResponse.json(
        { error: "MLflow is not configured. Set tracking URL in Production settings." },
        { status: 400 }
      );
    }

    const options = {
      trackingUrl: config.mlflowTrackingUrl,
      authUsername: config.mlflowAuthUsername,
      authPassword: config.mlflowAuthPassword,
    };

    // Fetch models from MLflow
    const mlflowModels = await fetchRegisteredModels(options);

    // Fetch all QUBE use cases for matching
    const useCases = await prismaClient.useCase.findMany({
      select: { id: true, title: true },
    });

    // Reconcile
    const syncOutput = reconcileModelsWithUseCases(mlflowModels, useCases);

    // Upsert each discovered model
    const now = new Date();
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
          syncedAt: now,
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
          syncedAt: now,
        },
      });
    }

    return NextResponse.json(syncOutput);
  } catch (error) {
    console.error("MLflow discover error:", error);
    return NextResponse.json(
      { error: "Failed to sync MLflow models" },
      { status: 500 }
    );
  }
});

export const GET = withAuth(async () => {
  try {
    const models = await prismaClient.mlflowDiscoveredModel.findMany({
      orderBy: { syncedAt: "desc" },
      include: {
        matchedUseCase: { select: { id: true, title: true } },
      },
    });

    const governedCount = models.filter((m) => m.governanceStatus === "governed").length;
    const ungovernedCount = models.filter((m) => m.governanceStatus === "ungoverned").length;
    const reviewNeededCount = models.filter((m) => m.governanceStatus === "review_needed").length;

    return NextResponse.json({
      totalModels: models.length,
      governedCount,
      ungovernedCount,
      reviewNeededCount,
      models,
      syncedAt: models[0]?.syncedAt ?? null,
    });
  } catch (error) {
    console.error("MLflow discover GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovered models" },
      { status: 500 }
    );
  }
});
