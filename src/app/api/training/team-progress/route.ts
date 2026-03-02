import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get all training completions for the organization
    const completions = await prismaClient.trainingCompletion.findMany({
      where: { organizationId },
      include: {
        program: {
          select: {
            isRequired: true
          }
        }
      }
    });

    // Group by user
    const userMap = new Map<string, any>();

    for (const completion of completions) {
      if (!userMap.has(completion.userId)) {
        userMap.set(completion.userId, {
          userId: completion.userId,
          userName: `User ${completion.userId.substring(0, 8)}`, // Placeholder
          userEmail: 'user@example.com', // Placeholder - would come from Clerk
          role: undefined,
          completedPrograms: 0,
          inProgressPrograms: 0,
          totalRequiredPrograms: 0,
          totalScore: 0,
          scoreCount: 0
        });
      }

      const userData = userMap.get(completion.userId);

      if (completion.status === 'COMPLETED') {
        userData.completedPrograms++;
        if (completion.score !== null) {
          userData.totalScore += completion.score;
          userData.scoreCount++;
        }
      } else if (completion.status === 'IN_PROGRESS') {
        userData.inProgressPrograms++;
      }

      if (completion.program.isRequired) {
        userData.totalRequiredPrograms++;
      }
    }

    // Calculate completion rates and average scores
    const teamMembers = Array.from(userMap.values()).map(member => ({
      ...member,
      averageScore: member.scoreCount > 0
        ? Math.round(member.totalScore / member.scoreCount)
        : undefined,
      completionRate: member.totalRequiredPrograms > 0
        ? Math.round((member.completedPrograms / member.totalRequiredPrograms) * 100)
        : 0
    })).map(({ totalScore, scoreCount, ...rest }) => rest);

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team progress' },
      { status: 500 }
    );
  }
}
