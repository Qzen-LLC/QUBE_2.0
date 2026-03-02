import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { vendorServiceServer } from '@/lib/vendorServiceServer';

import { prismaClient } from '@/utils/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = withAuth(async (request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Use the new role-based filtering
    const result = await vendorServiceServer.getVendors({
      role: userRecord.role,
      userId: userRecord.id,
      organizationId: userRecord.organizationId || undefined
    });
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Vendors API error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}, { requireUser: true });

export const POST = withAuth(async (
  request: Request,
  { auth }: { auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const vendorData = await request.json();
    console.log('[API_LOG] Received vendor data:', {
      name: vendorData.name,
      website: vendorData.website,
      category: vendorData.category,
      contactPerson: vendorData.contactPerson,
      contactEmail: vendorData.contactEmail
    });
    
    console.log('[API_LOG] Full vendor data received:', vendorData);
    let createArgs: any = { ...vendorData };
    if (userRecord.organizationId) {
      createArgs.organizationId = userRecord.organizationId;
      createArgs.userId = null;
    } else {
      createArgs.userId = userRecord.id;
      createArgs.organizationId = null;
    }
    
    console.log('[API_LOG] Create args being passed to vendorService:', {
      name: createArgs.name,
      website: createArgs.website,
      category: createArgs.category,
      userId: createArgs.userId,
      organizationId: createArgs.organizationId
    });
    const result = await vendorServiceServer.createVendor(createArgs);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    console.error('Vendors POST API error:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}, { requireUser: true });