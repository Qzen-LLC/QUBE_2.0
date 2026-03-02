import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';

import { prismaClient } from '@/utils/db';

// PUT /api/risks/[useCaseId]/[riskId] - Update a risk
export const PUT = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string; riskId: string }>, auth: any }
) => {
  try {
    // Await params as required by Next.js 15
    const { useCaseId, riskId } = await params;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();

    const updateData: any = {
      updatedBy: userRecord.id,
      updatedByName: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || 'Unknown User',
      updatedByEmail: userRecord.email,
    };

    // Add fields that can be updated
    if (data.status !== undefined) updateData.status = data.status;
    if (data.mitigationPlan !== undefined) updateData.mitigationPlan = data.mitigationPlan;
    if (data.mitigationStatus !== undefined) updateData.mitigationStatus = data.mitigationStatus;
    if (data.assignedToName !== undefined) updateData.assignedToName = data.assignedToName;
    if (data.assignedToEmail !== undefined) updateData.assignedToEmail = data.assignedToEmail;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.actualDate !== undefined) updateData.actualDate = data.actualDate ? new Date(data.actualDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.sourceType !== undefined) updateData.sourceType = data.sourceType;
    if (data.sourceId !== undefined) updateData.sourceId = data.sourceId;

    const risk = await prismaClient.risk.update({
      where: { id: riskId },
      data: updateData
    });
    console.log('[CRUD_LOG] Risk updated:', { id: riskId, useCaseId: useCaseId, status: data.status, updatedAt: risk.updatedAt, authoredBy: userRecord.id });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error updating risk:', error);
    return NextResponse.json(
      { error: 'Failed to update risk' },
      { status: 500 }
    );
  }
}, { requireUser: true });

// DELETE /api/risks/[useCaseId]/[riskId] - Delete a risk
export const DELETE = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string; riskId: string }>, auth: any }
) => {
  try {
    // Await params as required by Next.js 15
    const { useCaseId, riskId } = await params;

    // auth context is provided by withAuth wrapper
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prismaClient.risk.delete({
      where: { id: riskId }
    });
    console.log('[CRUD_LOG] Risk deleted:', { id: riskId, useCaseId: useCaseId, authoredBy: userRecord.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json(
      { error: 'Failed to delete risk' },
      { status: 500 }
    );
  }
}, { requireUser: true });