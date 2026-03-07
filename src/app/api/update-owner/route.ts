import { prismaClient } from '@/utils/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { verifyUseCaseAccess } from '@/lib/org-scope';

export const POST = withAuth(async (req: Request, { auth }) => {
  try {
    const { useCaseId, ownerName } = await req.json();

    if (!useCaseId || !ownerName) {
      return NextResponse.json({ error: 'useCaseId and ownerName are required' }, { status: 400 });
    }

    if (!(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const useCase = await prismaClient.useCase.findUnique({
      where: { id: useCaseId },
      select: { primaryStakeholders: true },
    });

    if (!useCase) {
      return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
    }

    // Replace the first stakeholder (owner) while preserving the rest
    const stakeholders = useCase.primaryStakeholders || [];
    const updated = [ownerName, ...stakeholders.slice(1)];

    const result = await prismaClient.useCase.update({
      where: { id: useCaseId },
      data: { primaryStakeholders: updated, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, useCase: result });
  } catch (error) {
    console.error('Error updating owner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
