import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

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
        langfuseEnabled: config.langfuseEnabled ?? false,
        langfuseHost: config.langfuseHost,
        langsmithEnabled: config.langsmithEnabled ?? false,
        langsmithProject: config.langsmithProject,
      },
      update: {
        awsRegion: config.awsRegion,
        awsCostExplorerEnabled: config.awsCostExplorerEnabled,
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
