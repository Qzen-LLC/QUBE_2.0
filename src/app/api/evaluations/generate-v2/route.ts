import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { EvaluationContextAggregator } from '@/lib/evals/evaluation-context-aggregator';
import { EvaluationGenerationEngine, GenerationStrategy } from '@/lib/evals/evaluation-generation-engine';
import { prismaClient } from '@/utils/db';

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // Check authentication
    // auth context is provided by withAuth wrapper

    const body = await request.json();
    const {
      useCaseId,
      guardrailsId,
      generationStrategy = 'comprehensive',
      testIntensity = 'standard',
      focusAreas
    } = body;

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'Missing use case ID' },
        { status: 400 }
      );
    }

    // Check if LLM is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'LLM_CONFIGURATION_REQUIRED',
        message: 'LLM-powered evaluation generation requires OpenAI API key configuration',
        requiresConfiguration: true
      }, { status: 503 });
    }

    console.log('🚀 Starting LLM-powered evaluation generation...');
    console.log(`   Use Case: ${useCaseId}`);
    console.log(`   Guardrails ID received: ${guardrailsId}`);
    console.log(`   Strategy: ${generationStrategy}, Intensity: ${testIntensity}`);

    // Step 1: Build comprehensive context
    const contextAggregator = new EvaluationContextAggregator();
    
    // Add detailed error handling for guardrails
    let context;
    try {
      context = await contextAggregator.buildEvaluationContext(useCaseId, guardrailsId);
    } catch (contextError) {
      console.error('❌ Error building evaluation context:', contextError);
      console.error('   Error message:', contextError instanceof Error ? contextError.message : String(contextError));
      console.error('   Use Case ID:', useCaseId);
      console.error('   Guardrails ID:', guardrailsId);
      
      // If it's a guardrails error, provide more details
      if (contextError instanceof Error && contextError.message.includes('guardrails')) {
        // Try to fetch guardrails directly to see what's available
        try {
          const guardrailsCheck = await prismaClient.guardrail.findMany({
            where: { useCaseId },
            select: { id: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          console.error('   Available guardrails for this use case:', guardrailsCheck);
          
          if (guardrailsCheck.length > 0) {
            console.error('   Latest guardrail ID:', guardrailsCheck[0].id);
            console.error('   Requested guardrail ID:', guardrailsId);
            console.error('   IDs match:', guardrailsCheck[0].id === guardrailsId);
          }
        } catch (checkError) {
          console.error('   Could not check guardrails:', checkError);
        }
      }
      
      throw contextError;
    }
    
    console.log(`📊 Context built: ${context.guardrails.totalRules} guardrails, ${context.risks.identified.length} risks`);

    // Step 2: Generate evaluations using Direct LLM Engine
    console.log('🧠 Using direct LLM engine...');
    const engine = new EvaluationGenerationEngine();
    const strategy: GenerationStrategy = {
      type: generationStrategy as any,
      intensity: testIntensity as any,
      focusAreas,
      maxTestsPerSuite: testIntensity === 'light' ? 5 : testIntensity === 'thorough' ? 20 : 10,
      timeLimit: 60 // 60 seconds timeout
    };

    const evaluationConfig = await engine.generateEvaluations(context, strategy);

    const metaForLog = (evaluationConfig as any)?.metadata || {};
    console.log(`✅ LLM generation complete: ${metaForLog.totalScenarios ?? evaluationConfig.testSuites?.reduce((sum: number, s: any) => sum + (s.scenarios?.length || 0), 0) ?? 0} scenarios`);

    // Step 3: Save the generated evaluation configuration
    try {
      // Create evaluation record in database
      const evaluation = await prismaClient.evaluation.create({
        data: {
          useCaseId,
          name: `AI-Generated Evaluation ${new Date().toLocaleDateString()}`,
          description: `LLM-powered evaluation with ${evaluationConfig.testSuites.length} test suites`,
          configuration: evaluationConfig as any,
          status: 'pending',
          createdAt: new Date()
        }
      });

      console.log(`💾 Saved evaluation: ${evaluation.id}`);
      
      // Add database ID to config
      evaluationConfig.id = evaluation.id;
    } catch (saveError) {
      console.error('Failed to save evaluation:', saveError);
      // Continue without saving - evaluation can still be used
    }

    // Step 4: Return the evaluation configuration
    const meta = (evaluationConfig as any)?.metadata || {};
    return NextResponse.json({
      success: true,
      evaluationConfig,
      summary: {
        totalSuites: evaluationConfig.testSuites.length,
        totalScenarios: meta.totalScenarios ??
                       evaluationConfig.testSuites.reduce((sum: number, suite: any) => sum + (suite.scenarios?.length || 0), 0),
        coverage: meta.coverage ?? 'Not calculated',
        confidence: evaluationConfig.scoringFramework?.confidence?.overall || 0.85,
        generationMethod: 'direct-llm',
        estimatedDuration: meta.estimatedDuration ??
                          evaluationConfig.testSuites.length * 5000 // Rough estimate
      },
      message: 'Evaluation configuration generated successfully using AI'
    });

  } catch (error) {
    console.error('❌ Error generating LLM-powered evaluations:', error);
    console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Try to stringify error for more details
    try {
      const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error('   Error details (JSON):', errorDetails);
    } catch (stringifyError) {
      console.error('   Could not stringify error:', stringifyError);
    }
    
    // Check for specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('openai_api_key') || errorMessage.includes('api key')) {
        return NextResponse.json({
          success: false,
          error: 'LLM_CONFIGURATION_ERROR',
          message: 'OpenAI API key is not configured correctly',
          details: error.message,
          requiresConfiguration: true
        }, { status: 503 });
      }
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'GENERATION_TIMEOUT',
          message: 'Evaluation generation timed out. Try using a lighter intensity setting.',
          details: error.message
        }, { status: 504 });
      }
      
      if (errorMessage.includes('guardrails') || errorMessage.includes('no guardrails')) {
        console.error('   🔍 Guardrails error detected, returning detailed error');
        return NextResponse.json({
          success: false,
          error: 'GUARDRAILS_REQUIRED',
          message: 'Guardrails must be generated first before creating evaluations',
          details: error.message,
          debug: {
            useCaseId,
            guardrailsId,
            errorType: error.constructor.name
          }
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'GENERATION_FAILED',
      message: 'Failed to generate evaluation configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        useCaseId,
        guardrailsId,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    }, { status: 500 });
  }
}, { requireUser: true });

// GET endpoint to check generation status or retrieve existing evaluation
export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const searchParams = new URL(request.url).searchParams;
    const useCaseId = searchParams.get('useCaseId');
    const evaluationId = searchParams.get('evaluationId');

    if (!useCaseId && !evaluationId) {
      return NextResponse.json(
        { error: 'Missing useCaseId or evaluationId parameter' },
        { status: 400 }
      );
    }

    let evaluation;
    if (evaluationId) {
      evaluation = await prismaClient.evaluation.findUnique({
        where: { id: evaluationId }
      });
    } else {
      // Get the latest AI-generated evaluation for the use case
      const whereClause: any = {
        description: { contains: 'LLM-powered' }
      };
      if (useCaseId) whereClause.useCaseId = useCaseId;
      evaluation = await prismaClient.evaluation.findFirst({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!evaluation) {
      // Return 200 with empty payload to avoid frontend 404s in production
      return NextResponse.json({
        success: true,
        evaluation: null,
        message: 'No AI-generated evaluation found yet'
      });
    }

    return NextResponse.json({
      success: true,
      evaluation: {
        id: evaluation.id,
        status: evaluation.status,
        configuration: evaluation.configuration,
        createdAt: evaluation.createdAt,
        completedAt: evaluation.completedAt
      }
    });

  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch evaluation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });