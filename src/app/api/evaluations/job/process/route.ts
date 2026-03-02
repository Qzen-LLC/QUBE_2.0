import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { EvaluationContextAggregator } from '@/lib/evals/evaluation-context-aggregator';
import { EvaluationGenerationEngine, GenerationStrategy } from '@/lib/evals/evaluation-generation-engine';

// Increase max duration for this long-running endpoint
export const maxDuration = 300; // 5 minutes

/**
 * Recursively sanitize an object/array to remove undefined values
 * This is necessary because Prisma doesn't accept undefined in arrays
 */
function sanitizeForPrisma(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    // Filter out undefined values and recursively sanitize remaining items
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizeForPrisma(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForPrisma(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Process the evaluation job (internal function)
 * This runs asynchronously and updates the job status in the database
 */
async function processJobAsync(jobId: string, job: any) {
  console.log(`🚀 Processing evaluation job: ${jobId}`);

  try {
    // Step 1: Build comprehensive context
    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        progress: 10,
        currentStep: 'Aggregating context from assessments...'
      }
    });

    const contextAggregator = new EvaluationContextAggregator();
    const context = await contextAggregator.buildEvaluationContext(job.useCaseId, job.guardrailsId);

    console.log(`📊 Context built: ${context.guardrails.totalRules} guardrails, ${context.risks.identified.length} risks`);

    // Step 2: Update progress
    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        progress: 25,
        currentStep: 'Initializing AI generation engine...'
      }
    });

    // Step 3: Generate evaluations with progress updates
    const engine = new EvaluationGenerationEngine();
    const strategy: GenerationStrategy = {
      type: job.generationStrategy as any,
      intensity: job.testIntensity as any,
      maxTestsPerSuite: job.testIntensity === 'light' ? 5 : job.testIntensity === 'thorough' ? 20 : 10,
      timeLimit: 300 // 5 minutes
    };

    // Progress callback to update job status during generation
    const progressSteps = [
      { progress: 30, step: 'Generating test perspectives...' },
      { progress: 40, step: 'Creating adversarial test scenarios...' },
      { progress: 50, step: 'Creating safety test scenarios...' },
      { progress: 60, step: 'Creating performance test scenarios...' },
      { progress: 70, step: 'Generating guardrail-specific tests...' },
      { progress: 80, step: 'Synthesizing test suites...' }
    ];
    let currentStepIndex = 0;

    // Update progress periodically while waiting for generation
    const progressInterval = setInterval(async () => {
      if (currentStepIndex < progressSteps.length) {
        const stepInfo = progressSteps[currentStepIndex];
        try {
          await prismaClient.evaluationJob.update({
            where: { id: jobId },
            data: {
              progress: stepInfo.progress,
              currentStep: stepInfo.step
            }
          });
          currentStepIndex++;
        } catch (e) {
          // Ignore update errors
        }
      }
    }, 12000); // Update every 12 seconds

    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        progress: 30,
        currentStep: 'AI is generating test scenarios (this may take a few minutes)...'
      }
    });

    let evaluationConfig;
    try {
      evaluationConfig = await engine.generateEvaluations(context, strategy);
    } finally {
      clearInterval(progressInterval);
    }

    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        progress: 90,
        currentStep: 'Saving evaluation configuration...'
      }
    });

    // Sanitize the evaluation config to remove undefined values (Prisma doesn't accept them)
    const sanitizedConfig = sanitizeForPrisma(evaluationConfig);
    console.log(`🧹 Sanitized evaluation config for database storage`);

    // Step 4: Save the evaluation to the Evaluation table
    const evaluation = await prismaClient.evaluation.create({
      data: {
        useCaseId: job.useCaseId,
        name: `AI-Generated Evaluation ${new Date().toLocaleDateString()}`,
        description: `LLM-powered evaluation with ${sanitizedConfig.testSuites.length} test suites`,
        configuration: sanitizedConfig as any,
        status: 'pending',
        createdAt: new Date()
      }
    });

    // Add evaluation ID to sanitized config
    sanitizedConfig.id = evaluation.id;

    // Step 5: Mark job as completed
    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        currentStep: 'Generation complete!',
        result: {
          evaluationId: evaluation.id,
          evaluationConfig: sanitizedConfig,
          summary: {
            totalSuites: sanitizedConfig.testSuites.length,
            totalScenarios: sanitizedConfig.testSuites.reduce(
              (sum: number, suite: any) => sum + (suite.scenarios?.length || 0), 0
            ),
            generationMethod: 'direct-llm'
          }
        },
        completedAt: new Date()
      }
    });

    console.log(`✅ Evaluation job completed: ${jobId}`);

  } catch (processingError) {
    console.error('Error during evaluation generation:', processingError);

    // Mark job as failed
    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: processingError instanceof Error ? processingError.message : 'Unknown error during generation',
        completedAt: new Date()
      }
    });
  }
}

/**
 * POST /api/evaluations/job/process
 * Start processing a pending evaluation job
 * Returns immediately and processes in the background
 */
export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    const body = await request.json();
    const { jobId, runSync = false } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId' },
        { status: 400 }
      );
    }

    // Get the job
    const job = await prismaClient.evaluationJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (job.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        result: job.result,
        message: 'Job already completed'
      });
    }

    // Check if already processing
    if (job.status === 'processing') {
      return NextResponse.json({
        success: true,
        status: 'processing',
        progress: job.progress,
        currentStep: job.currentStep,
        message: 'Job is already processing'
      });
    }

    // Check if LLM is configured
    if (!process.env.OPENAI_API_KEY) {
      await prismaClient.evaluationJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: 'OpenAI API key is not configured'
        }
      });
      return NextResponse.json({
        success: false,
        error: 'LLM_CONFIGURATION_REQUIRED',
        message: 'OpenAI API key is not configured'
      }, { status: 503 });
    }

    // Update job status to processing
    await prismaClient.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        progress: 5,
        currentStep: 'Starting evaluation generation...'
      }
    });

    // For local development or when runSync is true, run synchronously
    // This allows the process to complete even in serverless environments
    if (runSync || process.env.NODE_ENV === 'development') {
      // Run the job and wait for completion
      await processJobAsync(jobId, job);

      // Fetch the updated job to return the result
      const updatedJob = await prismaClient.evaluationJob.findUnique({
        where: { id: jobId }
      });

      return NextResponse.json({
        success: true,
        status: updatedJob?.status || 'unknown',
        result: updatedJob?.result,
        message: 'Job processing completed'
      });
    }

    // For production on Vercel, we need to handle this differently
    // Start processing without awaiting (fire and forget)
    // Note: This only works if the function doesn't timeout
    processJobAsync(jobId, job).catch(err => {
      console.error('Background processing error:', err);
    });

    // Return immediately
    return NextResponse.json({
      success: true,
      status: 'processing',
      jobId,
      message: 'Job processing started'
    });

  } catch (error) {
    console.error('Error starting evaluation job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start evaluation job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });
