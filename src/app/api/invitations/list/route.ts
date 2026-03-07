import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

export const GET = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    const currentUser = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!currentUser.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }

    // QZEN_ADMIN can see all, ORG_ADMIN can see own org
    const isQzenAdmin = currentUser.role === 'QZEN_ADMIN';
    const isOrgAdmin = currentUser.role === 'ORG_ADMIN';

    if (!isQzenAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitations = await prismaClient.invitation.findMany({
      where: {
        organizationId: isQzenAdmin
          ? undefined
          : currentUser.organizationId,
      },
      include: {
        invitedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
