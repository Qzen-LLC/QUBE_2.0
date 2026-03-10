import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-gateway";
import { prismaClient } from "@/utils/db";
import { verifyUseCaseAccess } from "@/lib/org-scope";
import {
  UseCaseInputSchema,
  EnrichedContextSchema,
  interpret,
  generateFinOps,
  generateRisks,
  generateThreats,
  generateGuardrails,
  callLLM,
  EXECUTIVE_SUMMARY_PROMPT,
  mapRisks,
  mapThreats,
  mapGuardrails,
  mapFinOps,
} from "@/lib/architect";
import type { ArchitectureOutput, EnrichedContext } from "@/lib/architect";

export const maxDuration = 120;

export const POST = withAuth(async (request: Request, { auth }) => {
  const startTime = Date.now();
  let useCaseId: string | null = null;

  try {
    const body = await request.json();
    useCaseId = body.useCaseId;

    if (useCaseId && !(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Coerce wizard form data to satisfy Zod required fields
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

    if (!parsed.success || !useCaseId) {
      console.error("Generate validation:", parsed.success ? "Missing useCaseId" : parsed.error.flatten());
      return NextResponse.json(
        { error: "Invalid input", details: parsed.success ? "Missing useCaseId" : parsed.error.flatten() },
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
        status: "interpreting",
        pipelineStep: "scoring_pillars",
      },
      update: {
        pillarInputs: input as unknown as Record<string, unknown>,
        archetypeId: input.archetypeId,
        status: "interpreting",
        pipelineStep: "scoring_pillars",
      },
    });

    // Stage 1: Interpret (score + archetype match + enrich)
    // When enrichedContext is provided (from review step), skip interpret()
    // When absent, run interpret() as before (backward compat)
    let context: EnrichedContext;
    let pillarScores: Record<string, unknown>;

    if (body.enrichedContext) {
      context = EnrichedContextSchema.parse(body.enrichedContext);
      // Ensure useCaseId on context matches the request
      context = { ...context, useCaseId };
      pillarScores = (body.pillarScores as Record<string, unknown>) ?? {};
    } else {
      const result = await interpret(input);
      context = result.context;
      pillarScores = result.pillarScores;
    }

    await prismaClient.architectSession.update({
      where: { useCaseId },
      data: {
        pillarScores: pillarScores as unknown as Record<string, unknown>,
        enrichedContext: context as unknown as Record<string, unknown>,
        confidence: context.confidence,
        status: "generating",
        pipelineStep: "generating_outputs",
      },
    });

    // Stage 2: Generate outputs (finops + risk + threat in parallel, then guardrails)
    const [finopsOutput, riskOutput, threatOutput] = await Promise.all([
      generateFinOps(context),
      generateRisks(context),
      generateThreats(context),
    ]);

    await prismaClient.architectSession.update({
      where: { useCaseId },
      data: {
        finopsOutput: finopsOutput as unknown as Record<string, unknown>,
        pipelineStep: "generating_guardrails",
      },
    });

    // Stage 3: Guardrails (depends on threats + risks)
    const guardrailsOutput = await generateGuardrails(context, threatOutput, riskOutput);

    // Stage 4: Executive Summary
    const topCostDriver =
      finopsOutput.lineItems.length > 0
        ? finopsOutput.lineItems.reduce((max, li) =>
            li.monthlyCostMid > max.monthlyCostMid ? li : max
          ).category
        : "N/A";

    const summaryPrompt = EXECUTIVE_SUMMARY_PROMPT
      .replace("{context_json}", JSON.stringify(context, null, 2))
      .replace("{finops_low}", finopsOutput.summaryMonthlyLow.toLocaleString(undefined, { maximumFractionDigits: 0 }))
      .replace("{finops_high}", finopsOutput.summaryMonthlyHigh.toLocaleString(undefined, { maximumFractionDigits: 0 }))
      .replace("{top_cost_driver}", topCostDriver)
      .replace("{risk_posture}", riskOutput.riskPosture)
      .replace("{critical_risks}", String(riskOutput.criticalRisks))
      .replace("{threat_posture}", threatOutput.threatPosture)
      .replace("{critical_threats}", String(threatOutput.criticalThreats))
      .replace("{guardrail_coverage}", String(guardrailsOutput.coverageScore));

    const executiveSummary = await callLLM(summaryPrompt, {
      maxTokens: 1024,
      system: undefined,
    });

    // Build combined output
    const architectureOutput: ArchitectureOutput = {
      useCaseId: context.useCaseId,
      useCaseName: context.useCaseName,
      tier: context.recommendedTier,
      finops: finopsOutput,
      risk: riskOutput,
      threat: threatOutput,
      guardrails: guardrailsOutput,
      executiveSummary,
    };

    const totalDuration = Date.now() - startTime;

    // Save completed session
    await prismaClient.architectSession.update({
      where: { useCaseId },
      data: {
        architectureOutput: architectureOutput as unknown as Record<string, unknown>,
        executiveSummary,
        status: "completed",
        pipelineStep: null,
        modelUsed: "claude-3-haiku-20240307",
        totalDuration,
      },
    });

    // Persist to existing DB tables (Risk, Threat, Guardrail, FinOps)
    await persistOutputsToDb(architectureOutput, useCaseId);

    return NextResponse.json({
      output: architectureOutput,
      pillarScores,
      duration: totalDuration,
    });
  } catch (error) {
    console.error("Architect pipeline error:", error);

    if (useCaseId) {
      try {
        await prismaClient.architectSession.update({
          where: { useCaseId },
          data: {
            status: "failed",
            pipelineStep: `error: ${error instanceof Error ? error.message : "unknown"}`,
          },
        });
      } catch {
        // ignore update failure
      }
    }

    return NextResponse.json(
      { error: "Pipeline failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});

async function persistOutputsToDb(
  output: ArchitectureOutput,
  useCaseId: string
) {
  // Map and create risks
  const riskData = mapRisks(output, useCaseId);
  if (riskData.length > 0) {
    await prismaClient.risk.createMany({ data: riskData });
  }

  // Map and create threats
  const threatData = mapThreats(output, useCaseId);
  if (threatData.length > 0) {
    await prismaClient.threat.createMany({ data: threatData });
  }

  // Map and create guardrails
  const { guardrail: guardrailData, rules } = mapGuardrails(output, useCaseId);
  const guardrail = await prismaClient.guardrail.create({
    data: guardrailData,
  });
  if (rules.length > 0) {
    await prismaClient.guardrailRule.createMany({
      data: rules.map((r) => ({ ...r, guardrailId: guardrail.id })),
    });
  }

  // Update FinOps
  const finopsData = mapFinOps(output);
  try {
    await prismaClient.finOps.upsert({
      where: { useCaseId },
      create: {
        useCaseId,
        ...finopsData,
        ROI: 0,
        netValue: 0,
        cumOpCost: 0,
        cumValue: 0,
        devCostBase: 0,
        totalInvestment: finopsData.apiCostBase + finopsData.infraCostBase + finopsData.opCostBase,
        valueBase: 0,
        valueGrowthRate: 0.05,
      },
      update: finopsData,
    });
  } catch {
    // FinOps table may have different constraints, non-critical
  }
}
