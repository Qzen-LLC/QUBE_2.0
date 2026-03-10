import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { verifyUseCaseAccess } from "@/lib/org-scope";
import { UseCaseInputSchema, interpret } from "@/lib/architect";

export const maxDuration = 60;

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    const body = await request.json();
    const useCaseId = body.useCaseId;

    if (!useCaseId) {
      return NextResponse.json({ error: "Missing useCaseId" }, { status: 400 });
    }

    if (!(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Coerce wizard form data (same as generate route)
    const rawInput = body.input ?? {};
    const coerced = {
      name: rawInput.name || "Untitled",
      archetypeId: rawInput.archetypeId ?? null,
      technical: {
        useCaseCategory: "rag",
        description: "",
        ...rawInput.technical,
      },
      business: {
        businessOutcome: "",
        targetUsers: "",
        ...rawInput.business,
      },
      responsible: { ...rawInput.responsible },
      legal: { ...rawInput.legal },
      dataReadiness: { ...rawInput.dataReadiness },
    };

    const parsed = UseCaseInputSchema.safeParse(coerced);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Save session as "interpreting"
    await prismaClient.architectSession.upsert({
      where: { useCaseId },
      create: {
        useCaseId,
        pillarInputs: input as unknown as Record<string, unknown>,
        archetypeId: input.archetypeId,
        status: "awaiting_review",
        pipelineStep: "enriching",
      },
      update: {
        pillarInputs: input as unknown as Record<string, unknown>,
        archetypeId: input.archetypeId,
        status: "awaiting_review",
        pipelineStep: "enriching",
      },
    });

    // Run interpret() — scores pillars + enriches context
    const { context, pillarScores } = await interpret(input);

    // Save enriched context for review
    await prismaClient.architectSession.update({
      where: { useCaseId },
      data: {
        pillarScores: pillarScores as unknown as Record<string, unknown>,
        enrichedContext: context as unknown as Record<string, unknown>,
        confidence: context.confidence,
        status: "awaiting_review",
        pipelineStep: null,
      },
    });

    return NextResponse.json({
      enrichedContext: context,
      pillarScores,
    });
  } catch (error) {
    console.error("Enrich endpoint error:", error);
    return NextResponse.json(
      { error: "Enrichment failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
