import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';

// GET /api/admin/organizations/[orgId] - Get a specific organization
export const GET = withAuth(async (req, { auth, params }: { auth: any, params: { orgId: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only QZEN_ADMIN can access organization details
    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { orgId } = params;

    // Get organization details
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
        useCases: {
          select: {
            id: true,
            title: true,
            stage: true,
            priority: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}, { requireUser: true });
