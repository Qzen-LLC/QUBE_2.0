import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: userRecord,
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}, { requireUser: true });
