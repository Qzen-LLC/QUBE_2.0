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

    const trainings = await prismaClient.trainingCompletion.findMany({
      where: {
        organizationId,
        userId
      },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json(trainings);
  } catch (error) {
    console.error('Error fetching my trainings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training history' },
      { status: 500 }
    );
  }
}
