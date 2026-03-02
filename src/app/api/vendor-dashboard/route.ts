import { NextResponse } from 'next/server';
import { vendorServiceServer } from '@/lib/vendorServiceServer';
import { prismaClient } from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';

export const GET = withAuth(async (request, { auth }) => {
  try {
    // auth context is provided by withAuth wrapper
    const clerkId = auth.userId!;
    
    // Get user data from database
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await vendorServiceServer.getVendors({
      role: userRecord.role,
      userId: userRecord.id,
      organizationId: userRecord.organizationId || undefined
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Vendor dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}, { requireUser: true });