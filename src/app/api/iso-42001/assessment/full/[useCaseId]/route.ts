import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET(req: NextRequest, { params }: { params: Promise<{ useCaseId: string }> }) {
  const { useCaseId } = await params;
  try {
    const [clauses, annexCategories, assessment] = await Promise.all([
      prismaClient.iso42001Clause.findMany({ orderBy: { orderIndex: 'asc' } }),
      prismaClient.iso42001AnnexCategory.findMany({ orderBy: { orderIndex: 'asc' }, include: { items: true } }),
      prismaClient.iso42001Assessment.findUnique({
        where: { useCaseId },
        include: {
          subclauses: { include: { subclause: true } },
          annexes: { include: { item: true } },
        },
      }),
    ]);

    return NextResponse.json({ clauses, annexCategories, assessment });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch ISO 42001 assessment data', details: String(err) }, { status: 500 });
  }
} 