import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ assessmentId: string }>, auth: any }
) => {
  let assessmentId: string = '';
  let itemId: string = '';
  
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
    itemId = body.itemId;
    const { implementation, evidenceFiles } = body;
    
    console.log('🔄 ISO 27001 Annex API - Received data:', {
      assessmentId,
      itemId,
      implementation: implementation?.substring(0, 50) + '...',
      evidenceFilesCount: evidenceFiles?.length || 0,
      evidenceFiles
    });

    // Validate itemId format - should be a string like "A.5.1", not a UUID
    if (!itemId || typeof itemId !== 'string' || itemId.length < 3) {
      return NextResponse.json(
        { error: 'Invalid itemId format', details: 'itemId should be a string identifier like "A.5.1"' },
        { status: 400 }
      );
    }

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

    // First find the item by its itemId to get the UUID
    const annexItem = await prismaClient.iso27001AnnexItem.findUnique({
      where: { itemId }
    });

    if (!annexItem) {
      return NextResponse.json({ error: `Annex item ${itemId} not found` }, { status: 404 });
    }

    console.log('🔄 Found annex item:', { itemId, annexItemUuid: annexItem.id });

    // Check if an annex instance already exists
    const existingInstance = await prismaClient.iso27001AnnexInstance.findUnique({
      where: {
        assessmentId_itemId: {
          assessmentId,
          itemId
        }
      }
    });

    // Also check if there are any instances with the wrong itemId structure (UUID instead of string)
    const wrongStructureInstances = await prismaClient.iso27001AnnexInstance.findMany({
      where: {
        assessmentId,
        itemId: {
          not: itemId
        }
      },
      include: {
        item: true
      }
    });

    console.log('🔄 Existing annex instance check:', {
      assessmentId,
      itemId,
      existingInstance: existingInstance ? 'Found' : 'Not found',
      existingInstanceId: existingInstance?.id,
      existingImplementation: existingInstance?.implementation,
      wrongStructureInstances: wrongStructureInstances.map(inst => ({
        id: inst.id,
        itemId: inst.itemId,
        itemItemId: inst.item?.itemId
      }))
    });

    // Find existing instance first
    const existingAnnexInstance = await prismaClient.iso27001AnnexInstance.findFirst({
      where: {
        assessmentId,
        itemId
      }
    });

    let updatedInstance;
    try {
      if (existingAnnexInstance) {
        // Update existing instance
        console.log('ISO 27001 Annex - Updating existing instance:', existingAnnexInstance.id);
        updatedInstance = await prismaClient.iso27001AnnexInstance.update({
          where: { id: existingAnnexInstance.id },
          data: {
            implementation,
            evidenceFiles,
            status: implementation.trim() ? 'implemented' : 'pending',
            updatedAt: new Date()
          },
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        });
      } else {
        // Create new instance
        console.log('ISO 27001 Annex - Creating new instance for:', { itemId, assessmentId });
        updatedInstance = await prismaClient.iso27001AnnexInstance.create({
          data: {
            itemId,
            assessmentId,
            implementation,
            evidenceFiles,
            status: implementation.trim() ? 'implemented' : 'pending'
          },
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        });
      }
    } catch (dbError) {
      console.error('ISO 27001 Annex - Database error:', dbError);
      
      // If it's a unique constraint error, try to find and update the existing record
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        console.log('ISO 27001 Annex - Unique constraint error, attempting to find existing record...');
        
        // Try to find the record that's causing the conflict
        const conflictingRecord = await prismaClient.iso27001AnnexInstance.findFirst({
          where: {
            assessmentId,
            itemId
          }
        });
        
        if (conflictingRecord) {
          console.log('ISO 27001 Annex - Found conflicting record, updating it:', conflictingRecord.id);
          updatedInstance = await prismaClient.iso27001AnnexInstance.update({
            where: { id: conflictingRecord.id },
            data: {
              implementation,
              evidenceFiles,
              status: implementation.trim() ? 'implemented' : 'pending',
              updatedAt: new Date()
            },
            include: {
              item: {
                include: {
                  category: true
                }
              }
            }
          });
        } else {
          throw dbError;
        }
      } else {
        throw dbError;
      }
    }

    return NextResponse.json(updatedInstance);
  } catch (error) {
    console.error('Error saving ISO 27001 annex:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        console.error('Unique constraint violation details:', {
          assessmentId,
          itemId,
          error: error.message
        });
        return NextResponse.json(
          { 
            error: 'Annex instance already exists for this assessment',
            details: 'A record with the same assessment ID and item ID already exists',
            assessmentId,
            itemId
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