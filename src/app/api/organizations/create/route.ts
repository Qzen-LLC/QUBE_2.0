import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import prisma from '@/utils/db';
import { validateUserRole } from '@/utils/role-validation';

export const POST = withAuth(async (req: Request, { auth }: { auth: any }) => {
  try {
    // auth context is provided by withAuth wrapper

    const { invitationToken, organizationName, organizationDomain } = await req.json();

    if (!invitationToken) {
      return NextResponse.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    // Find and validate the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: invitationToken },
      include: {
        organization: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Invitation has already been accepted' }, { status: 400 });
    }

    // Extract organizationId from the invitation
    const organizationId = invitation.organizationId;
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Invalid invitation: missing organization ID' }, { status: 400 });
    }

    console.log('[Invitation Accept] Processing invitation:', {
      invitationId: invitation.id,
      organizationId,
      role: invitation.role,
      email: invitation.email
    });

    // Check if user already exists
    let userRecord = await prisma.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    // Validate and correct role if needed
    const validatedRole = validateUserRole(invitation.role, organizationId);
    
    if (!userRecord) {
      // Create user record if it doesn't exist
      console.log('[Invitation Accept] Creating new user with organizationId:', organizationId);
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
      console.log('[CRUD_LOG] User created:', { id: userRecord.id, email: userRecord.email, role: userRecord.role, organizationId: userRecord.organizationId, authoredBy: userRecord.id });
    } else {
      // Update existing user with organization and role
      console.log('[Invitation Accept] Updating existing user:', userRecord.id, 'with organizationId:', organizationId);
      userRecord = await prisma.user.update({
        where: { id: userRecord.id },
        data: {
          role: validatedRole,
          organizationId: organizationId,
        },
      });
      console.log('[CRUD_LOG] User updated:', { id: userRecord.id, role: userRecord.role, organizationId: userRecord.organizationId, authoredBy: userRecord.id });
    }

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
    console.log('[CRUD_LOG] Invitation Accepted:', { id: invitation.id, status: 'ACCEPTED', acceptedAt: new Date(), authoredBy: userRecord.id });

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        role: userRecord.role,
        organizationId: userRecord.organizationId,
      },
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
      },
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });