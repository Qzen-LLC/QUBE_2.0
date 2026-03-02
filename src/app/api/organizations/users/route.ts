import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

// Get users in organization (Org Admin only)
export const GET = withAuth(async (request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper

    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!currentUserRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUserRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get users in the same organization
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
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });

// Add user to organization (Org Admin only)
export const POST = withAuth(async (req: Request, { auth }: { auth: any }) => {
  try {
    // auth context is provided by withAuth wrapper

    const currentUserRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
      include: { organization: true }
    });

    if (!currentUserRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUserRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, firstName, lastName, role = 'ORG_USER' } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists in the organization
    const existingUser = await prismaClient.user.findFirst({
      where: {
        email,
        organizationId: currentUserRecord.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists in this organization' }, { status: 400 });
    }

    // Create user record in database (simplified approach without direct Clerk integration)
    const newUser = await prismaClient.user.create({
      data: {
        clerkId: `temp_${Date.now()}`, // Temporary ID until proper Clerk integration
        email,
        firstName: firstName || 'User',
        lastName: lastName || 'User',
        role,
        organizationId: currentUserRecord.organizationId,
        isActive: true,
      },
    });
    console.log('[CRUD_LOG] User created:', { id: newUser.id, email: newUser.email, role: newUser.role, organizationId: newUser.organizationId, authoredBy: currentUserRecord.id });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User added to organization successfully',
    });
  } catch (error) {
    console.error('Error adding user to organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, { requireUser: true });