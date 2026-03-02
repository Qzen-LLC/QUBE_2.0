import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const GET = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper

    const { useCaseId } = await params;

    // Check if use case exists and user has access
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify use case exists and user has access
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
    });

    if (!useCase) {
      return NextResponse.json({ 
        status: 'not_available',
        message: 'Use case not found',
        error: 'USE_CASE_NOT_FOUND'
      }, { status: 404 });
    }

    // Check permission
    const hasPermission = userRecord.role === 'QZEN_ADMIN' || 
                         (userRecord.role === 'ORG_ADMIN' && useCase.organizationId === userRecord.organizationId) ||
                         (userRecord.role === 'ORG_USER' && useCase.organizationId === userRecord.organizationId) ||
                         useCase.userId === userRecord.id;

    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find EU AI Act assessment progress
    const assessment = await prismaClient.euAiActAssessment.findUnique({
      where: { useCaseId },
      select: {
        id: true,
        status: true,
        progress: true,
        updatedAt: true
      }
    });

    if (!assessment) {
      return NextResponse.json({
        id: null,
        status: 'not_started',
        progress: 0,
        updatedAt: null
      });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching EU AI Act progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}, { requireUser: true });