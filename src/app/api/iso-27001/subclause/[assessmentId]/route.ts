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
    const assessment = await prismaClient.iso27001Assessment.findUnique({
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

    // Find existing instance first
    const existingInstance = await prismaClient.iso27001SubclauseInstance.findFirst({
      where: {
        subclauseId,
        assessmentId
      }
    });

    console.log('ISO 27001 Subclause - Debug info:', {
      subclauseId,
      assessmentId,
      existingInstance: existingInstance ? 'Found' : 'Not found',
      existingInstanceId: existingInstance?.id,
      existingImplementation: existingInstance?.implementation,
      existingEvidenceFiles: existingInstance?.evidenceFiles
    });

    let updatedInstance;
    try {
      if (existingInstance) {
        // Update existing instance
        console.log('ISO 27001 Subclause - Updating existing instance:', existingInstance.id);
        updatedInstance = await prismaClient.iso27001SubclauseInstance.update({
          where: { id: existingInstance.id },
          data: {
            implementation,
            evidenceFiles,
            status: implementation.trim() ? 'implemented' : 'pending',
            updatedAt: new Date()
          },
          include: {
            subclause: true
          }
        });
      } else {
        // Create new instance
        console.log('ISO 27001 Subclause - Creating new instance for:', { subclauseId, assessmentId });
        updatedInstance = await prismaClient.iso27001SubclauseInstance.create({
          data: {
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
      }
    } catch (dbError) {
      console.error('ISO 27001 Subclause - Database error:', dbError);
      
      // If it's a unique constraint error, try to find and update the existing record
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        console.log('ISO 27001 Subclause - Unique constraint error, attempting to find existing record...');
        
        // Try to find the record that's causing the conflict
        const conflictingRecord = await prismaClient.iso27001SubclauseInstance.findFirst({
          where: {
            subclauseId,
            assessmentId
          }
        });
        
        if (conflictingRecord) {
          console.log('ISO 27001 Subclause - Found conflicting record, updating it:', conflictingRecord.id);
          updatedInstance = await prismaClient.iso27001SubclauseInstance.update({
            where: { id: conflictingRecord.id },
            data: {
              implementation,
              evidenceFiles,
              status: implementation.trim() ? 'implemented' : 'pending',
              updatedAt: new Date()
            },
            include: {
              subclause: true
            }
          });
        } else {
          throw dbError;
        }
      } else {
        throw dbError;
      }
    }

    console.log('ISO 27001 Subclause - Successfully upserted:', {
      subclauseId,
      assessmentId,
      instanceId: updatedInstance.id,
      status: updatedInstance.status,
      evidenceFilesCount: updatedInstance.evidenceFiles.length
    });

    console.log('[CRUD_LOG] ISO 27001 Subclause Instance upserted:', { id: updatedInstance.id, subclauseId, assessmentId, status: updatedInstance.status, authoredBy: userRecord.id });

    return NextResponse.json(updatedInstance);
  } catch (error) {
    console.error('Error saving ISO 27001 subclause:', error);
    
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