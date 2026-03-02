import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

export const GET = withAuth(async (request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    // Check if user exists in database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      clerkUser: auth.user ? {
        id: auth.userId!,
        email: auth.user.email ?? undefined,
        firstName: auth.user.firstName ?? undefined,
        lastName: auth.user.lastName ?? undefined,
      } : null,
      databaseUser: userRecord,
      existsInDatabase: !!userRecord,
    });

  } catch (error) {
    console.error('Error in test-user route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}, { requireUser: true });