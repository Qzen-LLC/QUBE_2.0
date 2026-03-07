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
    const [topics, controlCategories, assessment] = await Promise.all([
      prismaClient.euAiActTopic.findMany({ orderBy: { orderIndex: 'asc' }, include: { subtopics: { include: { questions: true } } } }),
      prismaClient.euAiActControlCategory.findMany({ orderBy: { orderIndex: 'asc' }, include: { controls: true } }),
      prismaClient.euAiActAssessment.findUnique({
        where: { useCaseId },
        include: {
          answers: true,
          controls: { include: { controlStruct: true, subcontrols: { include: { subcontrolStruct: true } } } },
        },
      }),
    ]);

    return NextResponse.json({ topics, controlCategories, assessment });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch EU AI Act assessment data', details: String(err) }, { status: 500 });
  }
}, { requireUser: true });