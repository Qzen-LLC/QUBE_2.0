import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

export const PUT = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const { modelId, useCaseId } = body;

    if (!modelId) {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 }
      );
    }

    const updateData = useCaseId
      ? {
          matchedUseCaseId: useCaseId,
          matchMethod: "manual",
          matchConfidence: 1.0,
          governanceStatus: "governed",
        }
      : {
          matchedUseCaseId: null,
          matchMethod: null,
          matchConfidence: null,
          governanceStatus: "ungoverned",
        };

    const updated = await prismaClient.mlflowDiscoveredModel.update({
      where: { id: modelId },
      data: updateData,
      include: {
        matchedUseCase: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("MLflow match error:", error);
    return NextResponse.json(
      { error: "Failed to update model match" },
      { status: 500 }
    );
  }
});
