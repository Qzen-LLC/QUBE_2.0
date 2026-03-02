import { prismaClient } from '@/utils/db';
import { GuardrailsEngine } from '@/lib/agents/guardrails-engine';
import { ContextAggregator } from '@/lib/guardrails/context-aggregator';
import { ComprehensiveAssessment } from '@/lib/agents/types';

async function testEnhancedGuardrails() {
  console.log('🚀 Testing Enhanced Guardrail Generation for AICU-2...\n');

  try {
    // 1. Find AICU-2
    const useCase = await prismaClient.useCase.findFirst({
      where: { aiucId: 2 },
      include: {
        assessData: true,
        euAiActAssessments: true,
        iso42001Assessments: true,
        uaeAiAssessments: true,
        risks: true,
        Approval: true,
        finopsData: true,
        user: true,
        organization: true
      }
    });

    if (!useCase) {
      console.error('❌ Use case AICU-2 not found');
      return;
    }

    console.log(`✅ Found use case: ${useCase.title}`);
    console.log(`   Stage: ${useCase.stage}`);
    console.log(`   Priority: ${useCase.priority}\n`);

    // 2. Build complete context
    console.log('📊 Building comprehensive context...');
    const aggregator = new ContextAggregator();
    const completeContext = await aggregator.buildCompleteContext(
      useCase.id,
      useCase.assessData?.stepsData || {},
      useCase.user?.email || 'test@example.com'
    );

    // 3. Transform to ComprehensiveAssessment
    const assessment: ComprehensiveAssessment = {
      useCaseId: useCase.id,
      useCaseTitle: completeContext.useCase.title,
      department: completeContext.useCase.businessFunction || 'Unknown',
      owner: useCase.user?.email || 'Unknown',
      
      problemStatement: completeContext.useCase.problemStatement,
      proposedSolution: completeContext.useCase.proposedAISolution,
      currentState: completeContext.useCase.currentState,
      desiredState: completeContext.useCase.desiredState,
      successCriteria: completeContext.useCase.successCriteria,
      keyAssumptions: completeContext.useCase.keyAssumptions,
      keyBenefits: completeContext.useCase.keyBenefits || '',
      requiredResources: completeContext.useCase.requiredResources,
      
      primaryStakeholders: completeContext.useCase.primaryStakeholders,
      secondaryStakeholders: completeContext.useCase.secondaryStakeholders,
      
      confidenceLevel: completeContext.useCase.confidenceLevel,
      operationalImpact: completeContext.useCase.operationalImpactScore,
      productivityImpact: completeContext.useCase.productivityImpactScore,
      revenueImpact: completeContext.useCase.revenueImpactScore,
      implementationComplexity: completeContext.useCase.implementationComplexity,
      
      timeline: completeContext.useCase.estimatedTimeline,
      initialCost: completeContext.useCase.initialCost || '',
      initialROI: completeContext.useCase.initialROI,
      
      technicalFeasibility: completeContext.assessments.technical || {},
      businessFeasibility: completeContext.assessments.business || {},
      ethicalImpact: completeContext.assessments.ethical || {},
      riskAssessment: completeContext.assessments.risk || {},
      dataReadiness: completeContext.assessments.data || {},
      roadmapPosition: completeContext.assessments.roadmap || {},
      budgetPlanning: completeContext.assessments.budget || {},
      
      organizationPolicies: completeContext.organization?.policies || {
        aiEthics: ['Transparency', 'Accountability', 'Fairness', 'Privacy'],
        dataGovernance: ['Data minimization', 'Purpose limitation', 'Accuracy'],
        riskAppetite: 'moderate',
        prohibitedUses: [],
        requiredSafeguards: []
      },
      
      approvalStatus: completeContext.governance.finalQualification,
      approvalConditions: [],
      identifiedRisks: completeContext.risks.identified,
      residualRiskLevel: completeContext.risks.residualRiskLevel,
      
      financialConstraints: completeContext.financial ? {
        budget: completeContext.financial.budgetRange,
        roi: completeContext.financial.roi,
        totalInvestment: completeContext.financial.totalInvestment
      } : undefined,
      
      complianceRequirements: completeContext.compliance
    };

    // 4. Test guardrail generation
    console.log('🧪 Testing enhanced guardrail generation...\n');
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY not set. Skipping actual LLM calls.');
      console.log('   Set OPENAI_API_KEY in .env to test full generation.\n');
      
      // Simulate what would be generated
      console.log('📋 Expected guardrail categories with enhanced system:');
      console.log('   ✅ Security Vulnerabilities (NEW):');
      console.log('      - Prompt injection defense');
      console.log('      - Jailbreak prevention');
      console.log('      - Adversarial input detection');
      console.log('   ✅ Performance SLA (NEW):');
      console.log('      - Response time enforcement (5-30s)');
      console.log('      - Availability monitoring');
      console.log('      - Circuit breakers');
      console.log('   ✅ Cost Optimization (NEW):');
      console.log('      - Token usage alerts (30K/month)');
      console.log('      - Budget monitoring ($210K)');
      console.log('      - Context compression');
      console.log('   ✅ Data Governance (NEW):');
      console.log('      - Data minimization');
      console.log('      - Model drift monitoring');
      console.log('      - HIPAA compliance');
      console.log('   ✅ Critical Safety (ENHANCED)');
      console.log('   ✅ Operational (ENHANCED)');
      console.log('   ✅ Ethical (ENHANCED)');
      console.log('   ✅ Economic (ENHANCED)\n');
      
      return;
    }

    const engine = new GuardrailsEngine();
    const guardrails = await engine.generateGuardrails(
      assessment,
      assessment.organizationPolicies
    );

    // 5. Analyze results
    console.log('📊 Analysis of Generated Guardrails:\n');
    
    const allRules: any[] = [];
    Object.entries(guardrails.guardrails?.rules || {}).forEach(([category, rules]: [string, any]) => {
      if (Array.isArray(rules)) {
        console.log(`   ${category.toUpperCase()}: ${rules.length} rules`);
        allRules.push(...rules);
      }
    });

    console.log(`\n   TOTAL: ${allRules.length} rules`);
    console.log(`   Confidence: ${Math.round((guardrails.confidence?.overall || 0) * 100)}%\n`);

    // 6. Check for previously missing guardrails
    console.log('🔍 Checking for previously missing guardrails:\n');
    
    const checkForGuardrail = (name: string, keywords: string[]) => {
      const found = allRules.some(rule => 
        keywords.some(keyword => 
          rule.rule?.toLowerCase().includes(keyword.toLowerCase()) ||
          rule.description?.toLowerCase().includes(keyword.toLowerCase()) ||
          rule.type?.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      console.log(`   ${found ? '✅' : '❌'} ${name}`);
      return found;
    };

    checkForGuardrail('Prompt Injection Defense', ['prompt injection', 'jailbreak', 'injection']);
    checkForGuardrail('Token Usage Optimization', ['token', 'usage', 'optimization', 'budget']);
    checkForGuardrail('Model Drift Monitoring', ['drift', 'degradation', 'model monitoring']);
    checkForGuardrail('Response Time Enforcement', ['response time', 'latency', 'timeout', 'sla']);
    checkForGuardrail('Data Minimization', ['minimization', 'data collection', 'purpose limitation']);

    // 7. Save enhanced guardrails
    console.log('\n💾 Saving enhanced guardrails...');
    
    const guardrailRecord = await prismaClient.guardrail.create({
      data: {
        useCaseId: useCase.id,
        name: 'Enhanced AI Guardrails (Test)',
        description: `Enhanced guardrails with domain-specific rules for ${useCase.title}`,
        approach: 'multi-agent-enhanced',
        configuration: guardrails,
        reasoning: guardrails.reasoning || {},
        confidence: guardrails.confidence?.overall || 0.85,
        status: 'draft'
      }
    });

    console.log(`✅ Saved with ID: ${guardrailRecord.id}\n`);

    // Save to file for review
    const fs = await import('fs/promises');
    await fs.writeFile(
      './enhanced-guardrails-test.json',
      JSON.stringify(guardrails, null, 2)
    );
    console.log('📄 Full guardrails saved to: enhanced-guardrails-test.json');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the test
console.log('=' . repeat(60));
console.log('ENHANCED GUARDRAIL GENERATION TEST');
console.log('=' . repeat(60));
console.log('');

testEnhancedGuardrails()
  .then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });