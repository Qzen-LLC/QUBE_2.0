import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';
import {
  createAccessToken,
  createRefreshToken,
  setAuthCookies,
} from '@/services/auth/jwt-auth-service';

export const POST = withAuth(async (request: Request, { auth }: { auth: any }) => {
  try {
    const currentUser = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.organizationId) {
      return NextResponse.json({ error: 'User already belongs to an organization' }, { status: 400 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await prismaClient.invitation.findUnique({
      where: { token },
      include: { organization: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invitation is no longer valid' }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Accept: assign user to org, mark invitation as accepted
    const result = await prismaClient.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      const updatedUser = await tx.user.update({
        where: { id: currentUser.id },
        data: {
          organizationId: invitation.organizationId,
          role: invitation.role as any,
        },
      });

      return updatedUser;
    });

    // Re-issue tokens with new orgId
    const accessToken = await createAccessToken({
      clerkId: result.clerkId,
      role: result.role,
      organizationId: result.organizationId,
    });

    const tokenFamily = uuidv4();
    const session = await prismaClient.session.create({
      data: {
        userId: result.id,
        tokenFamily,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const refreshToken = await createRefreshToken(session.id, tokenFamily);

    const response = NextResponse.json({
      success: true,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
      },
    });

    setAuthCookies(response.headers, accessToken, refreshToken);
    return response;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });
