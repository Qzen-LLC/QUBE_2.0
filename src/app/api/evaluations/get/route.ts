import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


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

    // Fetch evaluation by id or latest by useCaseId
    let evaluation: any = null;
    if (evaluationId) {
      evaluation = await prismaClient.evaluation.findUnique({
        where: { id: evaluationId }
      });
    } else if (useCaseId) {
      evaluation = await prismaClient.evaluation.findFirst({
        where: { useCaseId: useCaseId as string },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!evaluation) {
      return NextResponse.json({
        success: true,
        evaluationConfig: null,
        results: [],
        summary: null
      });
    }

    // Fetch results for this evaluation, if any
    const results = await prismaClient.evaluationResult.findMany({
      where: { evaluationId: evaluation.id }
    });

    // Return normalized payload expected by frontend
    return NextResponse.json({
      success: true,
      evaluationId: evaluation.id,
      status: evaluation.status,
      completedAt: evaluation.completedAt,
      summary: evaluation.summary || null,
      evaluationConfig: {
        ...(evaluation.configuration || {}),
        id: evaluation.id
      },
      results
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });