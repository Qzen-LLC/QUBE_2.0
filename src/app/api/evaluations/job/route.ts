import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

/**
 * POST /api/evaluations/job
 * Creates a new evaluation generation job and returns immediately
 * The actual generation happens via the /process endpoint
 */
export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    const body = await request.json();
    const {
      useCaseId,
      guardrailsId,
      generationStrategy = 'comprehensive',
      testIntensity = 'standard'
    } = body;

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'Missing use case ID' },
        { status: 400 }
      );
    }

    if (!guardrailsId) {
      return NextResponse.json(
        { error: 'Missing guardrails ID' },
        { status: 400 }
      );
    }

    // Check if there's already a pending/processing job for this use case
    const existingJob = await prismaClient.evaluationJob.findFirst({
      where: {
        useCaseId,
        status: { in: ['pending', 'processing'] }
      }
    });

    if (existingJob) {
      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status,
        progress: existingJob.progress,
        currentStep: existingJob.currentStep,
        message: 'Existing job found'
      });
    }

    // Create new evaluation job
    const job = await prismaClient.evaluationJob.create({
      data: {
        useCaseId,
        guardrailsId,
        generationStrategy,
        testIntensity,
        status: 'pending',
        progress: 0,
        currentStep: 'Queued for processing'
      }
    });

    console.log(`📋 Created evaluation job: ${job.id} for use case: ${useCaseId}`);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      message: 'Evaluation job created successfully'
    });

  } catch (error) {
    console.error('Error creating evaluation job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create evaluation job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });

/**
 * GET /api/evaluations/job?jobId=xxx
 * Get the status of an evaluation job
 */
export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const useCaseId = searchParams.get('useCaseId');

    if (!jobId && !useCaseId) {
      return NextResponse.json(
        { error: 'Missing jobId or useCaseId parameter' },
        { status: 400 }
      );
    }

    let job;
    if (jobId) {
      job = await prismaClient.evaluationJob.findUnique({
        where: { id: jobId }
      });
    } else {
      // Get the latest job for this use case
      job = await prismaClient.evaluationJob.findFirst({
        where: { useCaseId: useCaseId! },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!job) {
      return NextResponse.json({
        success: true,
        job: null,
        message: 'No job found'
      });
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        useCaseId: job.useCaseId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        completedAt: job.completedAt
      }
    });

  } catch (error) {
    console.error('Error fetching evaluation job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch evaluation job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });
