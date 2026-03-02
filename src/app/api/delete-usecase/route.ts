import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import prismaClient from '@/utils/db';

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    // Get user data from database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { useCaseId } = await request.json();

    if (!useCaseId) {
      return NextResponse.json({ error: 'Use case ID is required' }, { status: 400 });
    }

    // Get the use case to check permissions
    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
      include: { organization: true, user: true }
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZen admin can delete any use case
    } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
      // Org admin and org user can delete use cases in their organization
      if (useCase.organizationId !== userRecord.organizationId) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } else {
      // Regular users can only delete their own use cases
      if (useCase.userId !== userRecord.id) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    }

    // Delete the use case
    await prismaClient.useCase.delete({
      where: {
        id: useCaseId,
      },
    });
    console.log('[CRUD_LOG] UseCase deleted:', { id: useCaseId, title: useCase.title, authoredBy: userRecord.id });

    return NextResponse.json({ message: 'Use case deleted successfully' });
  } catch (error) {
    console.error('Error deleting use case:', error);
    return NextResponse.json({ error: 'Failed to delete use case' }, { status: 500 });
  }
}, { requireUser: true });