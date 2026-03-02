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

    // Get total programs for this organization
    const totalPrograms = await prismaClient.trainingProgram.count({
      where: {
        organizationId,
        isActive: true
      }
    });

    // Get user's training completions
    const completions = await prismaClient.trainingCompletion.findMany({
      where: {
        userId,
        organizationId
      }
    });

    const completedPrograms = completions.filter(c => c.status === 'COMPLETED').length;
    const inProgressPrograms = completions.filter(c => c.status === 'IN_PROGRESS').length;
    const certificatesEarned = completions.filter(c => c.certificateUrl).length;

    // Calculate team completion rate (simplified)
    const allCompletions = await prismaClient.trainingCompletion.count({
      where: {
        organizationId,
        status: 'COMPLETED'
      }
    });

    const allEnrollments = await prismaClient.trainingCompletion.count({
      where: { organizationId }
    });

    const teamCompletionRate = allEnrollments > 0
      ? Math.round((allCompletions / allEnrollments) * 100)
      : 0;

    return NextResponse.json({
      totalPrograms,
      completedPrograms,
      inProgressPrograms,
      certificatesEarned,
      teamCompletionRate
    });
  } catch (error) {
    console.error('Error fetching training stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training stats' },
      { status: 500 }
    );
  }
}
