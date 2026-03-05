import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";

// GET /api/architect/session/[useCaseId] — Get wizard progress
export const GET = withAuth(
  async (
    _request: Request,
    { params }: { params: Promise<{ useCaseId: string }> }
  ) => {
    try {
      const { useCaseId } = await params;

      const session = await prismaClient.architectSession.findUnique({
        where: { useCaseId },
      });

      if (!session) {
        return NextResponse.json(null);
      }

      return NextResponse.json(session);
    } catch (error) {
      console.error("Error fetching architect session:", error);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }
  }
);

// PUT /api/architect/session/[useCaseId] — Update wizard progress
export const PUT = withAuth(
  async (
    request: Request,
    { params }: { params: Promise<{ useCaseId: string }> }
  ) => {
    try {
      const { useCaseId } = await params;
      const body = await request.json();

      const session = await prismaClient.architectSession.upsert({
        where: { useCaseId },
        create: {
          useCaseId,
          pillarInputs: body.pillarInputs ?? {},
          archetypeId: body.archetypeId,
          status: body.status ?? "draft",
          pipelineStep: body.pipelineStep,
        },
        update: {
          pillarInputs: body.pillarInputs,
          archetypeId: body.archetypeId,
          pillarScores: body.pillarScores,
          enrichedContext: body.enrichedContext,
          finopsOutput: body.finopsOutput,
          architectureOutput: body.architectureOutput,
          executiveSummary: body.executiveSummary,
          status: body.status,
          pipelineStep: body.pipelineStep,
          confidence: body.confidence,
          modelUsed: body.modelUsed,
          totalDuration: body.totalDuration,
        },
      });

      return NextResponse.json(session);
    } catch (error) {
      console.error("Error updating architect session:", error);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }
  }
);
