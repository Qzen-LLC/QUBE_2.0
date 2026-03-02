import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from '@/utils/db';

/**
 * GET /api/assessment-expansion/[expansionId]
 * Returns expansion details by ID.
 */
export const GET = withAuth(async (
  request: Request,
  { params }: { params: Promise<{ expansionId: string }> }
) => {
  const { expansionId } = await params;

  const expansion = await prismaClient.assessmentExpansion.findUnique({
    where: { id: expansionId },
  });

  if (!expansion) {
    return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
  }

  return NextResponse.json({ expansion });
}, { requireUser: true });

/**
 * PUT /api/assessment-expansion/[expansionId]
 * Saves user review/overrides to the expansion record.
 *
 * Body: { userOverrides: Record<string, any> }
 */
export const PUT = withAuth(async (
  request: Request,
  { params, auth }: { params: Promise<{ expansionId: string }>; auth: any }
) => {
  const { expansionId } = await params;
  const body = await request.json();
  const { userOverrides } = body;

  const expansion = await prismaClient.assessmentExpansion.findUnique({
    where: { id: expansionId },
  });

  if (!expansion) {
    return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
  }

  const updated = await prismaClient.assessmentExpansion.update({
    where: { id: expansionId },
    data: {
      userOverrides: userOverrides as any,
      userReviewed: true,
      reviewedAt: new Date(),
      reviewedBy: auth?.userId || null,
    },
  });

  return NextResponse.json({ expansion: updated });
}, { requireUser: true });
