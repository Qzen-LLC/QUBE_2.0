import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get("useCaseId");
    if (!useCaseId) {
      return NextResponse.json({ error: "Missing useCaseId" }, { status: 400 });
    }
    const config = await prismaClient.productionConfiguration.findUnique({
      where: { useCaseId },
    });
    if (!config) {
      return NextResponse.json(null);
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error("Production setup GET error:", error);
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
});

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { useCaseId, ...config } = body;

    const productionConfig = await prismaClient.productionConfiguration.upsert({
      where: { useCaseId: useCaseId ?? "global" },
      create: {
        useCaseId: useCaseId ?? null,
        awsRegion: config.awsRegion,
        awsCostExplorerEnabled: config.awsCostExplorerEnabled ?? false,
        costAllocationTagKey: config.costAllocationTagKey ?? null,
        costAllocationTagValue: config.costAllocationTagValue ?? null,
        langfuseEnabled: config.langfuseEnabled ?? false,
        langfuseHost: config.langfuseHost,
        langsmithEnabled: config.langsmithEnabled ?? false,
        langsmithProject: config.langsmithProject,
      },
      update: {
        awsRegion: config.awsRegion,
        awsCostExplorerEnabled: config.awsCostExplorerEnabled,
        costAllocationTagKey: config.costAllocationTagKey,
        costAllocationTagValue: config.costAllocationTagValue,
        langfuseEnabled: config.langfuseEnabled,
        langfuseHost: config.langfuseHost,
        langsmithEnabled: config.langsmithEnabled,
        langsmithProject: config.langsmithProject,
      },
    });

    return NextResponse.json(productionConfig);
  } catch (error) {
    console.error("Production setup error:", error);
    return NextResponse.json(
      { error: "Failed to save production config" },
      { status: 500 }
    );
  }
});
