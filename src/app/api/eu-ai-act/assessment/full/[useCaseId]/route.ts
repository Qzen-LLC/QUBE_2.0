import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';


export async function GET(req: NextRequest, { params }: { params: Promise<{ useCaseId: string }> }) {
  const { useCaseId } = await params;
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
} 