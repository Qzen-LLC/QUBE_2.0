import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: 'Organization ID and User ID are required' },
        { status: 400 }
      );
    }

    // Get competency requirements for this organization
    const requirements = await prismaClient.competencyRequirement.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { competency: 'asc' }
      ]
    });

    // Get user's competency assessments
    const assessments = await prismaClient.competencyAssessment.findMany({
      where: {
        userId,
        organizationId
      }
    });

    // Combine requirements with user assessments
    const competencies = requirements.map(req => {
      const assessment = assessments.find(a => a.competency === req.competency);

      const LEVEL_SCORE: Record<string, number> = {
        'NONE': 0,
        'BEGINNER': 1,
        'INTERMEDIATE': 2,
        'ADVANCED': 3,
        'EXPERT': 4
      };

      const requiredScore = LEVEL_SCORE[req.requiredLevel];
      const currentScore = LEVEL_SCORE[assessment?.currentLevel || 'NONE'];
      const gap = Math.max(0, requiredScore - currentScore);

      return {
        id: req.id,
        framework: req.framework,
        category: req.category,
        competency: req.competency,
        requiredLevel: req.requiredLevel,
        currentLevel: assessment?.currentLevel,
        assessmentDate: assessment?.assessmentDate,
        gap
      };
    });

    return NextResponse.json(competencies);
  } catch (error) {
    console.error('Error fetching competency matrix:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competency matrix' },
      { status: 500 }
    );
  }
}
