import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

export const POST = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    const currentUser = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { invitationId } = await request.json();
    if (!invitationId) {
      return NextResponse.json({ error: 'invitationId is required' }, { status: 400 });
    }

    const invitation = await prismaClient.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check permissions
    const isQzenAdmin = currentUser.role === 'QZEN_ADMIN';
    const isOrgAdmin = currentUser.role === 'ORG_ADMIN' && currentUser.organizationId === invitation.organizationId;

    if (!isQzenAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation is not pending' }, { status: 400 });
    }

    await prismaClient.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
