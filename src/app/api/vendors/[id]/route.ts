import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { vendorServiceServer } from '@/lib/vendorServiceServer';

import { prismaClient } from '@/utils/db';

interface Params {
  id: string;
}

export const PUT = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<Params>, auth: any }
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
    const resolvedParams = await params;
    console.log('[API_LOG] Received vendor update data:', {
      id: resolvedParams.id,
      name: vendorData.name,
      website: vendorData.website,
      category: vendorData.category,
      contactPerson: vendorData.contactPerson,
      contactEmail: vendorData.contactEmail
    });
    
    console.log('[API_LOG] Full vendor update data received:', vendorData);
    
    console.log('[API_LOG] Update args being passed to vendorService:', {
      vendorId: resolvedParams.id,
      name: vendorData.name,
      website: vendorData.website,
      category: vendorData.category
    });

    // Get the vendor to check ownership
    const vendor = await prismaClient.vendor.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        // USER can only update their own vendors
        if (vendor.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only update vendors in their organization
        if (vendor.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const result = await vendorServiceServer.updateVendor(resolvedParams.id, vendorData);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Vendor PUT API error:', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}, { requireUser: true });

export const DELETE = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<Params>, auth: any }
) => {
  try {
    // auth context is provided by withAuth wrapper
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;

    // Get the vendor to check ownership
    const vendor = await prismaClient.vendor.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check permissions based on role
    if (userRecord.role !== 'QZEN_ADMIN') {
      if (userRecord.role === 'USER') {
        // USER can only delete their own vendors
        if (vendor.userId !== userRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
        // ORG_ADMIN and ORG_USER can only delete vendors in their organization
        if (vendor.organizationId !== userRecord.organizationId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const result = await vendorServiceServer.deleteVendor(resolvedParams.id);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Vendor DELETE API error:', error);
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}, { requireUser: true });