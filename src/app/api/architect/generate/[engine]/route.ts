import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import {
  generateFinOps,
  generateRisks,
  generateThreats,
  generateGuardrails,
} from "@/lib/architect";
import type { EnrichedContext, ThreatOutput } from "@/lib/architect";

export const maxDuration = 60;

// POST /api/architect/generate/[engine] — Re-generate a single engine output
export const POST = withAuth(
  async (
    request: Request,
    { params }: { params: Promise<{ engine: string }> }
  ) => {
    try {
      const { engine } = await params;
      const body = await request.json();
      const { useCaseId } = body;

      if (!useCaseId) {
        return NextResponse.json(
          { error: "Missing useCaseId" },
          { status: 400 }
        );
      }

      const session = await prismaClient.architectSession.findUnique({
        where: { useCaseId },
      });

      if (!session?.enrichedContext) {
        return NextResponse.json(
          { error: "No enriched context found. Run full pipeline first." },
          { status: 400 }
        );
      }

      const ctx = session.enrichedContext as unknown as EnrichedContext;

      let result: unknown;

      switch (engine) {
        case "finops":
          result = await generateFinOps(ctx);
          break;
        case "risk":
          result = await generateRisks(ctx);
          break;
        case "threat":
          result = await generateThreats(ctx);
          break;
        case "guardrails": {
          // Guardrails needs the threat output
          const archOutput = session.architectureOutput as Record<string, unknown> | null;
          const threatData = archOutput?.threat as ThreatOutput | undefined;
          if (!threatData) {
            return NextResponse.json(
              { error: "Threat output required for guardrails regeneration" },
              { status: 400 }
            );
          }
          result = await generateGuardrails(ctx, threatData);
          break;
        }
        default:
          return NextResponse.json(
            { error: `Unknown engine: ${engine}` },
            { status: 400 }
          );
      }

      return NextResponse.json({ engine, output: result });
    } catch (error) {
      console.error("Engine re-generation error:", error);
      return NextResponse.json(
        { error: "Re-generation failed" },
        { status: 500 }
      );
    }
  }
);
