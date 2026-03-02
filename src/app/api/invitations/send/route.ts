import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import prisma from '@/utils/db';

export const POST = withAuth(async (req: Request, { auth }: { auth: any }) => {
  try {
    const currentUserRecord = await prisma.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!currentUserRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { email, role = 'USER', organizationId } = await req.json();
    if (!email || !organizationId) {
      return NextResponse.json({ error: 'Email and organizationId are required' }, { status: 400 });
    }

    // QZEN_ADMIN can invite to any org, ORG_ADMIN can only invite to their own org
    if (
      currentUserRecord.role === 'QZEN_ADMIN' ||
      (currentUserRecord.role === 'ORG_ADMIN' && currentUserRecord.organizationId === organizationId)
    ) {
      // Create database invitation
      const dbInvitation = await prisma.invitation.create({
        data: {
          email,
          role,
          organizationId,
          invitedById: currentUserRecord.id,
          token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      return NextResponse.json({
        success: true,
        invitation: {
          id: dbInvitation.id,
          token: dbInvitation.token,
        },
        message: 'Invitation created successfully!',
      });
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
