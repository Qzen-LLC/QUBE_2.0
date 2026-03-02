import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

/**
 * PUT /api/threats/[useCaseId]/[threatId]
 * Update a threat.
 */
export const PUT = withAuth(async (
  request: Request,
  { params }: { params: Promise<{ useCaseId: string; threatId: string }> }
) => {
  const { useCaseId, threatId } = await params;
  const body = await request.json();

  const existing = await prismaClient.threat.findFirst({
    where: { id: threatId, useCaseId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Threat not found' }, { status: 404 });
  }

  const updated = await prismaClient.threat.update({
    where: { id: threatId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.severity !== undefined && { severity: body.severity }),
      ...(body.severityScore !== undefined && { severityScore: body.severityScore }),
      ...(body.likelihood !== undefined && { likelihood: body.likelihood }),
      ...(body.attackVector !== undefined && { attackVector: body.attackVector }),
      ...(body.affectedAsset !== undefined && { affectedAsset: body.affectedAsset }),
      ...(body.mitigationPlan !== undefined && { mitigationPlan: body.mitigationPlan }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(updated);
}, { requireUser: true });

/**
 * DELETE /api/threats/[useCaseId]/[threatId]
 * Delete a threat.
 */
export const DELETE = withAuth(async (
  request: Request,
  { params }: { params: Promise<{ useCaseId: string; threatId: string }> }
) => {
  const { useCaseId, threatId } = await params;

  const existing = await prismaClient.threat.findFirst({
    where: { id: threatId, useCaseId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Threat not found' }, { status: 404 });
  }

  await prismaClient.threat.delete({ where: { id: threatId } });

  return NextResponse.json({ success: true });
}, { requireUser: true });
