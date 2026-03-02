import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';


const VALID_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export const POST = withAuth(async (
  request: Request,
  { auth }: { auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { useCaseId, priority } = await request.json();

    if (!useCaseId || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate priority value
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      const useCase = await prismaClient.useCase.findUnique({
        where: { id: useCaseId },
      });
      
      if (!useCase) {
        return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
      }
      
      if (userRecord.role === 'USER') {
        // USER can only update their own use cases
        if (useCase.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN') {
        // ORG_ADMIN can only update use cases in their organization
        if (useCase.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_USER') {
        // ORG_USER cannot update use case priorities
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updatedUseCase = await prismaClient.useCase.update({
      where: { id: useCaseId },
      data: { 
        priority: priority,
        updatedAt: new Date() 
      },
    });
    console.log('[CRUD_LOG] UseCase priority updated:', { id: useCaseId, priority, updatedAt: updatedUseCase.updatedAt, authoredBy: userRecord.id });

    return NextResponse.json(updatedUseCase);
  } catch (error) {
    console.error('Error updating priority:', error);
    return NextResponse.json({ error: 'Failed to update priority' }, { status: 500 });
  }
}, { requireUser: true });