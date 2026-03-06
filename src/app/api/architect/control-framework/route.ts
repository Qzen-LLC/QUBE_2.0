import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { buildControlFramework } from "@/lib/architect/engine/control-framework";
import { getEvalStatus } from "@/lib/architect";
import type { ArchitectureOutput } from "@/lib/architect/models/outputs";

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get("useCaseId");

    if (!useCaseId) {
      return NextResponse.json({ error: "Missing useCaseId" }, { status: 400 });
    }

    const session = await prismaClient.architectSession.findUnique({
      where: { useCaseId },
    });

    if (!session?.architectureOutput) {
      return NextResponse.json(
        { error: "No architect session found for this use case" },
        { status: 404 }
      );
    }

    const architectureOutput = session.architectureOutput as unknown as ArchitectureOutput;

    // Optionally load live eval status
    let evalOutput;
    try {
      evalOutput = await getEvalStatus(useCaseId);
      // Only use eval output if it has results
      if (!evalOutput.guardrailResults || evalOutput.guardrailResults.length === 0) {
        evalOutput = undefined;
      }
    } catch {
      // Eval status not available — build framework without live data
    }

    const result = buildControlFramework(architectureOutput, evalOutput);

    // Enrich chains with eval-derived severity from Risk table
    try {
      const risks = await prismaClient.risk.findMany({
        where: { useCaseId, sourceType: "architect-pipeline" },
        select: { sourceId: true, evalDerivedSeverity: true },
      });
      const riskSeverityMap = new Map(
        risks.filter((r) => r.sourceId).map((r) => [r.sourceId!, r.evalDerivedSeverity])
      );
      for (const chain of result.chains) {
        const derived = riskSeverityMap.get(chain.risk.id);
        if (derived) {
          chain.risk.evalDerivedSeverity = derived;
        }
      }
    } catch {
      // evalDerivedSeverity field may not exist yet — continue without enrichment
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Control framework error:", error);
    return NextResponse.json(
      { error: "Failed to build control framework", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
