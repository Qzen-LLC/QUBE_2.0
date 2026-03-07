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

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Cannot deactivate self
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    const targetUser = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Permission check
    const isQzenAdmin = currentUser.role === 'QZEN_ADMIN';
    const isOrgAdmin = currentUser.role === 'ORG_ADMIN' && currentUser.organizationId === targetUser.organizationId;

    if (!isQzenAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Cannot deactivate QZEN_ADMIN unless you are QZEN_ADMIN
    if (targetUser.role === 'QZEN_ADMIN' && !isQzenAdmin) {
      return NextResponse.json({ error: 'Cannot deactivate a QZEN_ADMIN' }, { status: 403 });
    }

    await prismaClient.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all active sessions
    await prismaClient.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
