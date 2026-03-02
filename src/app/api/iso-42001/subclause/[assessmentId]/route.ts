import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ assessmentId: string }>, auth: any }
) => {
  let subclauseId: string = '';
  let assessmentId: string = '';
  
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    assessmentId = (await params).assessmentId;
    const body = await request.json();
    subclauseId = body.subclauseId;
    const { implementation, evidenceFiles } = body;

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

    // Check if a subclause instance already exists
    const existingInstance = await prismaClient.iso42001SubclauseInstance.findUnique({
      where: {
        subclauseId_assessmentId: {
          subclauseId,
          assessmentId
        }
      }
    });

    console.log('ISO 42001 Subclause - Debug info:', {
      subclauseId,
      assessmentId,
      existingInstance: existingInstance ? 'Found' : 'Not found',
      existingInstanceId: existingInstance?.id,
      existingImplementation: existingInstance?.implementation,
      existingEvidenceFiles: existingInstance?.evidenceFiles
    });

    // Upsert the subclause instance (create if doesn't exist, update if it does)
    const updatedInstance = await prismaClient.iso42001SubclauseInstance.upsert({
      where: {
        subclauseId_assessmentId: {
          subclauseId,
          assessmentId
        }
      },
      update: {
        implementation,
        evidenceFiles,
        status: implementation.trim() ? 'implemented' : 'pending',
        updatedAt: new Date()
      },
      create: {
        subclauseId,
        assessmentId,
        implementation,
        evidenceFiles,
        status: implementation.trim() ? 'implemented' : 'pending'
      },
      include: {
        subclause: true
      }
    });

    console.log('ISO 42001 Subclause - Successfully upserted:', {
      subclauseId,
      assessmentId,
      instanceId: updatedInstance.id,
      status: updatedInstance.status,
      evidenceFilesCount: updatedInstance.evidenceFiles.length
    });

    console.log('[CRUD_LOG] ISO 42001 Subclause Instance upserted:', { id: updatedInstance.id, subclauseId, assessmentId, status: updatedInstance.status, authoredBy: userRecord.id });

    return NextResponse.json(updatedInstance);
  } catch (error) {
    console.error('Error saving ISO 42001 subclause:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        console.error('Unique constraint violation details:', {
          subclauseId,
          assessmentId,
          error: error.message
        });
        return NextResponse.json(
          { 
            error: 'Subclause instance already exists for this assessment',
            details: 'A record with the same subclause ID and assessment ID already exists',
            subclauseId,
            assessmentId
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to save implementation',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save implementation' },
      { status: 500 }
    );
  }
}, { requireUser: true });