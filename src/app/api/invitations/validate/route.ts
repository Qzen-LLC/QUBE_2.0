import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        organizationId: invitation.organizationId,
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
        },
        invitedBy: {
          firstName: invitation.invitedBy.firstName,
          lastName: invitation.invitedBy.lastName,
          email: invitation.invitedBy.email,
        },
        expiresAt: invitation.expiresAt,
      },
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 