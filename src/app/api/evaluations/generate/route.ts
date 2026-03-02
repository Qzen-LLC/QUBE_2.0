import { NextRequest, NextResponse } from 'next/server';
import { EvaluationOrchestrator } from '@/lib/evals/evaluation-orchestrator';
import { GuardrailsConfig, ComprehensiveAssessment } from '@/lib/agents/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { useCaseId, guardrailsConfig, assessmentData } = body;

    if (!useCaseId || !guardrailsConfig) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Transform assessment data to ComprehensiveAssessment format
    const comprehensiveAssessment: ComprehensiveAssessment = {
      useCaseId,
      useCaseTitle: assessmentData?.title || 'Untitled Use Case',
      department: assessmentData?.department || 'Unknown',
      owner: assessmentData?.owner || 'Unknown',
      technicalFeasibility: assessmentData?.technicalFeasibility || {},
      businessFeasibility: assessmentData?.businessFeasibility || {},
      ethicalImpact: assessmentData?.ethicalImpact || {},
      riskAssessment: assessmentData?.riskAssessment || {},
      dataReadiness: assessmentData?.dataReadiness || {},
      roadmapPosition: assessmentData?.roadmapPosition || {},
      budgetPlanning: assessmentData?.budgetPlanning || {}
    };

    // Initialize the evaluation orchestrator
    const orchestrator = new EvaluationOrchestrator();

    // Generate evaluations from guardrails
    console.log(`🎯 Generating evaluations for use case: ${useCaseId}`);
    const evaluationConfig = await orchestrator.generateEvaluations(
      guardrailsConfig as GuardrailsConfig,
      comprehensiveAssessment
    );

    // Log successful generation
    console.log(`✅ Evaluations generated successfully for use case: ${useCaseId}`);
    console.log(`   - Test suites: ${evaluationConfig.testSuites.length}`);
    console.log(`   - Total scenarios: ${evaluationConfig.testSuites.reduce((sum, suite) => sum + suite.scenarios.length, 0)}`);

    return NextResponse.json(evaluationConfig);
  } catch (error) {
    console.error('Error generating evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}