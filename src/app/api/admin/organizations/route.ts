import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

// Get all organizations (QZen Admin only)
export const GET = withAuth(async (request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!currentUserRecord || currentUserRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch organizations from DB
    const organizations = await prismaClient.organization.findMany({
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

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });

// Create new organization (QZen Admin only)
export const POST = withAuth(async (req: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!currentUserRecord || currentUserRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, domain, adminEmail, adminFirstName, adminLastName } = await req.json();

    console.log('Creating organization with:', { name, domain, adminEmail, adminFirstName, adminLastName });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    if (!adminEmail || !adminEmail.trim()) {
      return NextResponse.json({ error: 'Admin email is required' }, { status: 400 });
    }

    // Check for existing org by name or domain (case-insensitive, trimmed)
    const existingOrg = await prismaClient.organization.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' as const } },
          ...(domain ? [{ domain: { equals: domain.trim(), mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    console.log('Existing org check result:', existingOrg ? { id: existingOrg.id, name: existingOrg.name, domain: existingOrg.domain } : 'NONE');

    if (existingOrg) {
      console.log('Organization already exists, returning error');
      return NextResponse.json(
        { error: 'Organization with this name or domain already exists' },
        { status: 400 }
      );
    }

    // Check if admin user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { email: adminEmail.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create the organization and invitation in a transaction
    const result = await prismaClient.$transaction(async (tx) => {
      // Create the organization
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          domain: domain ? domain.trim() : null,
        },
      });

      // Create invitation for the admin user
      const invitation = await tx.invitation.create({
        data: {
          email: adminEmail.trim(),
          role: 'ORG_ADMIN',
          organizationId: org.id,
          invitedById: currentUserRecord.id,
          token: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      return { org, invitation };
    });

    // Invitation record created in database above
    const invitationSent = true;

    // Copy question templates to the new organization (non-blocking)
    let templatesCopied = false;
    let templateError: any = null;
    try {
      const templates = await prismaClient.questionTemplate.findMany({
        include: { optionTemplates: true },
      });
    
      if (templates.length > 0) {
        await prismaClient.$transaction(
          templates.map((template) =>
            prismaClient.question.create({
              data: {
                text: template.text,
                type: template.type,
                templateId: template.id,
                organizationId: result.org.id,
                stage: template.stage,
                options: {
                  create: template.optionTemplates.map((opt) => ({ text: opt.text })),
                },
              },
            })
          )
        );
        templatesCopied = true;
        console.log('[Organization Creation] Copied', templates.length, 'question templates to organization');
      }
    } catch (error: any) {
      templateError = error;
      console.error('[Organization Creation] Error copying question templates:', error);
      // Don't fail the organization creation if template copying fails
    }

    return NextResponse.json({ 
      success: true, 
      organization: result.org,
      invitation: {
        id: result.invitation.id,
        email: result.invitation.email,
        role: result.invitation.role,
        token: result.invitation.token,
        sent: invitationSent,
      },
      templates: {
        copied: templatesCopied,
        error: templateError ? (templateError?.message || 'Unknown error') : null,
      }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });

// Delete organization (QZen Admin only)
export const DELETE = withAuth(async (req: Request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!currentUserRecord || currentUserRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: true,
        useCases: true,
        vendors: true,
        invitations: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Deleting organization and all related data:', {
      id: organization.id,
      name: organization.name,
      usersCount: organization.users.length,
      useCasesCount: organization.useCases.length,
      vendorsCount: organization.vendors.length,
      invitationsCount: organization.invitations.length,
    });

    // Delete organization and all related data in a transaction
    await prismaClient.$transaction(async (tx) => {
      // Get all user IDs in the organization before deletion
      const orgUserIds = organization.users.map(user => user.id);

      // Delete invitations created by users in this organization
      // (both for this org and any other orgs they may have invited to)
      if (orgUserIds.length > 0) {
        await tx.invitation.deleteMany({
          where: { 
            OR: [
              { organizationId: organizationId },
              { invitedById: { in: orgUserIds } }
            ]
          },
        });
      } else {
        // If no users, just delete invitations for this organization
        await tx.invitation.deleteMany({
          where: { organizationId: organizationId },
        });
      }

      // Delete all use cases in the organization
      // This will cascade delete all nested data (FinOps, Assessments, Approvals, Guardrails, etc.)
      // because those models have onDelete: Cascade on their UseCase relationship
      await tx.useCase.deleteMany({
        where: { organizationId: organizationId },
      });

      // Delete all vendors in the organization
      // This will cascade delete all nested data (AssessmentScore, ApprovalArea)
      // because those models have onDelete: Cascade on their Vendor relationship
      await tx.vendor.deleteMany({
        where: { organizationId: organizationId },
      });

      // Delete all users in the organization
      // This will cascade delete related data like Locks (which have onDelete: Cascade)
      await tx.user.deleteMany({
        where: { organizationId: organizationId },
      });

      // Delete the organization
      // Models with onDelete: Cascade will be automatically deleted:
      // - AiModel, Invitation, Question, GovernanceBody, TrainingProgram, etc.
      await tx.organization.delete({
        where: { id: organizationId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
      deletedOrganization: {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
      },
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });