import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const assessments = await prismaClient.maturityAssessment.findMany({
      where: { organizationId },
      orderBy: { assessmentDate: 'desc' }
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching maturity assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}
