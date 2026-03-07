import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';
import { verifyUseCaseAccess } from '@/lib/org-scope';

/**
 * GET /api/threats/[useCaseId]
 * List all threats for a use case.
 */
export const GET = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
) => {
  const { useCaseId } = await params;

  if (!(await verifyUseCaseAccess(auth, useCaseId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const threats = await prismaClient.threat.findMany({
    where: { useCaseId },
    orderBy: [{ severityScore: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(threats);
}, { requireUser: true });

/**
 * POST /api/threats/[useCaseId]
 * Create a manual threat.
 */
export const POST = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
) => {
  const { useCaseId } = await params;

  if (!(await verifyUseCaseAccess(auth, useCaseId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();

  const currentUser = await prismaClient.user.findFirst({
    where: { clerkId: auth.userId! },
  });

  const threat = await prismaClient.threat.create({
    data: {
      useCaseId,
      title: body.title,
      description: body.description,
      category: body.category || 'Information Disclosure',
      framework: body.framework || 'STRIDE',
      severity: body.severity || 'Medium',
      severityScore: body.severityScore || 5,
      likelihood: body.likelihood || 'Medium',
      attackVector: body.attackVector || '',
      affectedAsset: body.affectedAsset || '',
      mitigationPlan: body.mitigationPlan || '',
      mitreTechniqueIds: body.mitreTechniqueIds || [],
      justification: body.justification || '',
      sourceType: 'manual',
      createdBy: currentUser?.id || 'system',
      createdByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
      createdByEmail: currentUser?.email || 'system@qube.ai',
    },
  });

  return NextResponse.json(threat, { status: 201 });
}, { requireUser: true });
