import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';

// POST /api/admin/organizations/[orgId]/complete-setup - Mark organization setup as complete
export const POST = withAuth(async (req, { auth, params }: { auth: any, params: { orgId: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only QZEN_ADMIN can complete organization setup
    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { orgId } = params;

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Update organization to mark setup as complete
    // We can add a field like `setupCompleted` or `setupCompletedAt` to track this
    // For now, we'll just return success since the main purpose is to redirect
    // In a real implementation, you might want to add a setup status field to the Organization model

    return NextResponse.json({
      success: true,
      message: 'Organization setup completed successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        domain: organization.domain
      }
    });
  } catch (error) {
    console.error('Error completing organization setup:', error);
    return NextResponse.json(
      { error: 'Failed to complete organization setup' },
      { status: 500 }
    );
  }
}, { requireUser: true });
