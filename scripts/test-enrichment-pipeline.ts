/**
 * End-to-end test of the multi-call enrichment pipeline.
 * Usage: npx tsx scripts/test-enrichment-pipeline.ts
 */
import "dotenv/config";
import { interpret } from "../src/lib/architect/engine/interpreter";
import type { UseCaseInput } from "../src/lib/architect/models/pillars";

const testUseCase: UseCaseInput = {
  name: "Customer Support RAG Assistant",
  technical: {
    useCaseCategory: "rag",
    description:
      "An enterprise RAG-based assistant that answers customer support queries by retrieving information from internal knowledge bases, product documentation, and past ticket resolutions. Uses vector search over ~50k documents with real-time ingestion of new support articles.",
    targetModel: "claude-3-haiku-20240307",
    expectedLatencyMs: 2000,
    contextWindowNeeds: "medium",
    orchestrationComplexity: "moderate",
    deploymentTarget: "aws",
    toolUseRequired: false,
    multiModal: false,
    existingInfrastructure: "AWS EKS cluster with existing monitoring stack",
  },
  business: {
    businessOutcome: "Reduce average ticket resolution time by 40% and deflect 30% of L1 support tickets",
    targetUsers: "Customer support agents (200 users) and end customers via self-service portal",
    isCustomerFacing: true,
    estimatedDailyUsers: 500,
    estimatedDailyRequests: 5000,
    roiHypothesis: "Saving $15/ticket on 3000 monthly deflected tickets = $45k/month savings",
    operationalReadiness: "Existing support team trained on AI tools, IT team has cloud experience",
    changeManagementNeeds: "Training for support agents on prompt engineering and escalation workflows",
    growthRateMonthly: 0.08,
  },
  responsible: {
    affectedPopulation: "Enterprise customers across North America and Europe",
    decisionImpact: "advisory",
    explainabilityRequired: true,
    biasRiskFactors: "Language bias (English-centric), product line coverage bias",
    humanOversight: "escalation_only",
    transparencyRequirements: "AI disclosure required for customer-facing responses",
    fairnessCriteria: "Equal response quality across all product lines and customer tiers",
  },
  legal: {
    regulations: ["GDPR", "SOC2"],
    governanceFrameworks: ["ISO 27001"],
    dataClassification: "confidential",
    piiPresent: true,
    phiPresent: false,
    crossBorderDataFlows: true,
    ipCopyrightConcerns: "Product documentation may contain proprietary IP",
    liabilityModel: "Company liable for incorrect support guidance",
    auditRequired: true,
    consentRequirements: "Customer consent for AI-assisted support required",
  },
  dataReadiness: {
    dataSources: ["Zendesk tickets", "Confluence knowledge base", "Product documentation", "Release notes"],
    dataQualityScore: "medium",
    goldenDatasetExists: true,
    goldenDatasetSize: 500,
    labelingStatus: "partial",
    dataFreshness: "daily",
    corpusDocumentCount: 50000,
    pipelineMaturity: "managed",
  },
};

async function main() {
  console.log("=== Multi-Call Enrichment Pipeline E2E Test ===\n");
  console.log(`Use case: ${testUseCase.name}`);
  console.log(`Category: ${testUseCase.technical.useCaseCategory}\n`);

  const startTime = Date.now();

  try {
    const { context, pillarScores } = await interpret(testUseCase);
    const duration = Date.now() - startTime;

    console.log(`\n=== Pipeline completed in ${duration}ms ===\n`);

    // Check pillar scores
    console.log("--- Pillar Scores ---");
    console.log(JSON.stringify(pillarScores, null, 2).slice(0, 500));

    // Check root-level fields
    console.log("\n--- Root Meta ---");
    console.log(`  archetype: ${context.archetype}`);
    console.log(`  confidence: ${context.confidence}`);
    console.log(`  overallRiskPosture: ${context.overallRiskPosture}`);
    console.log(`  estimatedComplexity: ${context.estimatedComplexity}`);
    console.log(`  recommendedTier: ${context.recommendedTier}`);

    // Check each section has data
    const sections = [
      { name: "technical.components", value: context.technical.components, expected: "array" },
      { name: "technical.dataFlows", value: context.technical.dataFlows, expected: "array" },
      { name: "technical.hasToolUse", value: context.technical.hasToolUse, expected: "defined" },
      { name: "technical.encryptionRequirements", value: context.technical.encryptionRequirements, expected: "defined" },
      { name: "technical.failoverStrategy", value: context.technical.failoverStrategy, expected: "defined" },
      { name: "business.dailyRequests", value: context.business.dailyRequests, expected: "defined" },
      { name: "business.costSensitivityLevel", value: context.business.costSensitivityLevel, expected: "defined" },
      { name: "business.strategicImportance", value: context.business.strategicImportance, expected: "defined" },
      { name: "business.modelAlternativeCostDelta", value: context.business.modelAlternativeCostDelta, expected: "array" },
      { name: "responsible.guardrailLayersRequired", value: context.responsible.guardrailLayersRequired, expected: "array" },
      { name: "responsible.biasTesting", value: context.responsible.biasTesting, expected: "defined" },
      { name: "responsible.stageGateRequirements", value: context.responsible.stageGateRequirements, expected: "array" },
      { name: "legal.euAiActRiskCategory", value: context.legal.euAiActRiskCategory, expected: "defined" },
      { name: "legal.complianceCostEstimateUsd", value: context.legal.complianceCostEstimateUsd, expected: "defined" },
      { name: "legal.dataResidencyRequirements", value: context.legal.dataResidencyRequirements, expected: "array" },
      { name: "dataReadiness.slaRequirements", value: context.dataReadiness.slaRequirements, expected: "defined" },
      { name: "dataReadiness.incidentEscalationMatrix", value: context.dataReadiness.incidentEscalationMatrix, expected: "array" },
      { name: "readinessBlockers", value: context.readinessBlockers, expected: "array" },
      { name: "crossPillarConflicts", value: context.crossPillarConflicts, expected: "array" },
      { name: "confidenceFactors", value: context.confidenceFactors, expected: "defined" },
      { name: "assumptionLog", value: context.assumptionLog, expected: "array" },
      { name: "followUpQuestionsRequired", value: context.followUpQuestionsRequired, expected: "array" },
      { name: "goNoGoRecommendation", value: context.goNoGoRecommendation, expected: "defined" },
    ];

    console.log("\n--- Field Coverage ---");
    let populated = 0;
    let missing = 0;
    for (const s of sections) {
      const hasValue = s.value !== undefined && s.value !== null;
      const hasContent = s.expected === "array"
        ? Array.isArray(s.value) && s.value.length > 0
        : hasValue;
      const status = hasContent ? "OK" : "MISSING";
      if (hasContent) populated++;
      else missing++;
      console.log(`  [${status}] ${s.name} = ${JSON.stringify(s.value)?.slice(0, 100)}`);
    }

    console.log(`\n--- Summary ---`);
    console.log(`  Populated: ${populated}/${sections.length}`);
    console.log(`  Missing: ${missing}/${sections.length}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Go/No-Go: ${context.goNoGoRecommendation}`);

    if (missing > 3) {
      console.error(`\n⚠ WARNING: ${missing} fields missing — check console for failed pillar calls.`);
      process.exit(1);
    } else {
      console.log(`\n✅ Pipeline passed — all critical fields populated.`);
    }
  } catch (err) {
    console.error("\n❌ Pipeline failed:", err);
    process.exit(1);
  }
}

main();
