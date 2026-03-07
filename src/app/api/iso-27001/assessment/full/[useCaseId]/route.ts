import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';
import { verifyUseCaseAccess } from '@/lib/org-scope';


export const GET = withAuth(async (
  req: Request,
  { params, auth }: { params: Promise<{ useCaseId: string }>; auth: any }
) => {
  const { useCaseId } = await params;

  if (!(await verifyUseCaseAccess(auth, useCaseId))) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const [clauses, annexCategories, assessment] = await Promise.all([
      prismaClient.iso27001Clause.findMany({ orderBy: { orderIndex: 'asc' } }),
      prismaClient.iso27001AnnexCategory.findMany({ orderBy: { orderIndex: 'asc' }, include: { items: true } }),
      prismaClient.iso27001Assessment.findUnique({
        where: { useCaseId },
        include: {
          subclauses: { include: { subclause: true } },
          annexes: { include: { item: true } },
        },
      }),
    ]);

    return NextResponse.json({ clauses, annexCategories, assessment });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch ISO 27001 assessment data', details: String(err) }, { status: 500 });
  }
}, { requireUser: true });
