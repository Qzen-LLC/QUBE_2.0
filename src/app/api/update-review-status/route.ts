import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

export const POST = withAuth(async (req: Request, { auth }) => {
  try {
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { useCaseId, stage, status } = await req.json();

    if (!useCaseId || stage === undefined || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status
    if (status !== 'READY_FOR_REVIEW' && status !== 'NOT_READY_FOR_REVIEW') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Map stage number to review status field name (new five-pillar system)
    const fieldMap: Record<number, string> = {
      0: 'requirementsReviewStatus',
      1: 'technicalReviewStatus',
      2: 'businessReviewStatus',
      3: 'responsibleEthicalReviewStatus',
      4: 'legalRegulatoryReviewStatus',
      5: 'dataReadinessReviewStatus',
      6: 'finopsReviewStatus',
    };

    const fieldName = fieldMap[stage as number];
    if (!fieldName) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    // Update the review status
    const updatedUseCase = await prismaClient.useCase.update({
      where: { id: useCaseId },
      data: {
        [fieldName]: status,
      },
    });

    return NextResponse.json({
      success: true,
      useCase: updatedUseCase,
      message: `Review status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    return NextResponse.json(
      { error: 'Failed to update review status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, { requireUser: true });
