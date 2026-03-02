/**
 * @deprecated This endpoint is no longer used.
 * The system now only generates test scenarios, not executes them.
 * Use /api/evaluations/generate-v2 instead for test generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { EvaluationRunner } from '@/lib/evals/evaluation-runner';
import { EvaluationConfig, ExecutionEnvironment } from '@/lib/evals/types';

export async function POST(request: NextRequest) {
  // This endpoint is deprecated and should not be used
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. The system now only generates test scenarios, not executes them. Use /api/evaluations/generate-v2 for test generation.' 
    },
    { status: 410 } // 410 Gone status code
  );
}

// Original implementation preserved below for reference
/*
export async function POST_DEPRECATED(request: NextRequest) {
  try {
    const body = await request.json();
    const { evaluationConfig, environment } = body;

    if (!evaluationConfig) {
      return NextResponse.json(
        { error: 'Missing evaluation configuration' },
        { status: 400 }
      );
    }

    // Set default environment if not provided
    const executionEnvironment: ExecutionEnvironment = environment || {
      name: 'production',
      type: 'production',
      configuration: {
        mockResponses: false,
        deterministicMode: false
      }
    };

    // Log the execution environment configuration
    console.log(`🔧 Execution Environment: ${executionEnvironment.name}`);
    console.log(`   - Type: ${executionEnvironment.type}`);
    console.log(`   - Mock Responses: ${executionEnvironment.configuration.mockResponses}`);
    console.log(`   - Real AI Agents: ${!executionEnvironment.configuration.mockResponses}`);

    // Initialize the evaluation runner
    const runner = new EvaluationRunner();

    // Run the evaluation
    console.log(`🚀 Running evaluation: ${evaluationConfig.id}`);
    const result = await runner.runEvaluation(
      evaluationConfig as EvaluationConfig,
      executionEnvironment
    );

    // Log execution summary
    console.log(`✅ Evaluation completed: ${result.executionId}`);
    console.log(`   - Status: ${result.status}`);
    console.log(`   - Duration: ${result.duration}ms`);
    console.log(`   - Tests run: ${result.testResults.length}`);
    console.log(`   - Passed: ${result.testResults.filter(r => r.status === 'passed').length}`);
    console.log(`   - Failed: ${result.testResults.filter(r => r.status === 'failed').length}`);
    console.log(`   - Overall score: ${result.scores.overallScore.value.toFixed(1)}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to run evaluation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
*/