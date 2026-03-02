import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { vendorServiceServer } from '@/lib/vendorServiceServer';
import { prismaClient } from '@/utils/db';

export const POST = withAuth(async (request: Request, { auth }) => {
  try {
    // Only QZEN_ADMIN can initialize approval areas
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    
    if (!userRecord || userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const result = await vendorServiceServer.initializeAllMissingApprovalAreas();
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Approval areas initialized for all vendors' });
  } catch (error: any) {
    console.error('Initialize approvals API error:', error);
    return NextResponse.json({ error: 'Failed to initialize approval areas' }, { status: 500 });
  }
}, { requireUser: true });
