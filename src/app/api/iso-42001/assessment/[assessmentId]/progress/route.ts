import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';



export const PATCH = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ assessmentId: string }>, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { assessmentId } = await params;
    const { progress } = await request.json();

    // Get the assessment to check ownership
    const assessment = await prismaClient.iso42001Assessment.findUnique({
      where: { id: assessmentId },
      include: { useCase: true }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        // USER can only update their own assessments
        if (assessment.useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only update assessments in their organization
        if (assessment.useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const updatedAssessment = await prismaClient.iso42001Assessment.update({
      where: { id: assessmentId },
      data: {
        progress,
        status: progress >= 100 ? 'completed' : 'in_progress',
        updatedAt: new Date()
      }
    });
    console.log('[CRUD_LOG] ISO 42001 Assessment progress updated:', { id: assessmentId, progress, updatedAt: updatedAssessment.updatedAt, authoredBy: userRecord.id });

    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error('Error updating ISO 42001 assessment progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}, { requireUser: true });