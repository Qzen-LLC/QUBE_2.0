import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

// POST /api/risks/[useCaseId]/[riskId]/close - Close a risk
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string; riskId: string }>, auth: any }
) => {
  try {
    const { useCaseId, riskId } = await params;
    
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { closureReason } = await request.json();

    const risk = await prismaClient.risk.update({
      where: { id: riskId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: userRecord.id,
        closedByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown User',
        closedByEmail: userRecord.email,
        closureReason,
        updatedBy: userRecord.id,
        updatedByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown User',
        updatedByEmail: userRecord.email,
      }
    });
    console.log('[CRUD_LOG] Risk closed:', { id: riskId, useCaseId, closedAt: risk.closedAt, updatedAt: risk.updatedAt, authoredBy: userRecord.id });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error closing risk:', error);
    return NextResponse.json(
      { error: 'Failed to close risk' },
      { status: 500 }
    );
  }
}, { requireUser: true });