import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import prisma from '@/utils/db';
import { validateUserRole } from '@/utils/role-validation';

export const POST = withAuth(async (req: Request, { auth }: { auth: any }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const role = body.role as string;
    const organizationId = body.organizationId as string;

    if (!role || !organizationId) {
      return NextResponse.json({
        error: 'Invalid invitation data',
        message: 'role and organizationId are required in the request body'
      }, { status: 400 });
    }

    // Check if user already exists
    let userRecord = await prisma.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    const validatedRole = validateUserRole(role, organizationId);

    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          clerkId: auth.userId!,
          email: auth.user?.email || '',
          firstName: auth.user?.firstName || null,
          lastName: auth.user?.lastName || null,
          role: validatedRole,
          organizationId: organizationId,
        },
      });
    } else {
      userRecord = await prisma.user.update({
        where: { id: userRecord.id },
        data: {
          role: validatedRole,
          organizationId: organizationId,
        },
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({
        error: 'Organization not found',
        message: 'The organization you were invited to no longer exists'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        organizationId: userRecord.organizationId,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      message: 'Successfully joined organization',
    });

  } catch (error) {
    console.error('[Invitation] Error processing invitation:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process invitation'
    }, { status: 500 });
  }
}, { requireUser: true });
