import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

// Get users in organization (any authenticated user in the organization)
export const GET = withAuth(async (request, { auth }) => {
  try {
    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!currentUserRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has an organization, get members from that organization
    if (currentUserRecord.organizationId) {
      const users = await prismaClient.user.findMany({
        where: {
          organizationId: currentUserRecord.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ],
      });

      return NextResponse.json({ users });
    }

    // If user doesn't have an organization, return empty array
    return NextResponse.json({ users: [] });
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });

