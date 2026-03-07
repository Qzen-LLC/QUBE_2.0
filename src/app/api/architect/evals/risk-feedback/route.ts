import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { verifyUseCaseAccess } from "@/lib/org-scope";
import { getEvalStatus } from "@/lib/architect";
import { computeRiskAdjustmentsFromEvals } from "@/lib/architect/engine/risk-feedback";
import type { GuardrailsOutput, ArchitectureOutput } from "@/lib/architect/models/outputs";

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get("useCaseId");

    if (!useCaseId) {
      return NextResponse.json({ error: "Missing useCaseId" }, { status: 400 });
    }

    if (!(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Load architect session for guardrails output
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
    const guardrailsOutput: GuardrailsOutput = architectureOutput.guardrails;

    // Get current eval status
    const evalOutput = await getEvalStatus(useCaseId);

    // Compute risk adjustments
    const feedbackOutput = computeRiskAdjustmentsFromEvals(evalOutput, guardrailsOutput);

    // Update Risk records with eval-derived severity
    const now = new Date();
    for (const adjustment of feedbackOutput.adjustments) {
      // Look up actual risk by sourceId to get real severity
      const risk = await prismaClient.risk.findFirst({
        where: { useCaseId, sourceId: adjustment.riskId },
      });

      if (risk) {
        // Re-calculate with actual severity
        const severityLadder = ["low", "medium", "high", "critical"];
        const originalIdx = severityLadder.indexOf(risk.riskLevel.toLowerCase());
        const escalationLevels = adjustment.adjustedSeverity === "critical" ? 2 : 1;
        const adjustedIdx = Math.min(
          (originalIdx === -1 ? 1 : originalIdx) + escalationLevels,
          severityLadder.length - 1
        );
        const actualAdjusted = severityLadder[adjustedIdx];

        adjustment.originalSeverity = risk.riskLevel.toLowerCase();
        adjustment.adjustedSeverity = actualAdjusted;

        await prismaClient.risk.update({
          where: { id: risk.id },
          data: {
            evalDerivedSeverity: actualAdjusted.charAt(0).toUpperCase() + actualAdjusted.slice(1),
            evalLastUpdated: now,
          },
        });
      }
    }

    return NextResponse.json(feedbackOutput);
  } catch (error) {
    console.error("Risk feedback error:", error);
    return NextResponse.json(
      { error: "Failed to compute risk feedback", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});
