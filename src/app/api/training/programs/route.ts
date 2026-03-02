import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const programs = await prismaClient.trainingProgram.findMany({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: [
        { isRequired: 'desc' },
        { title: 'asc' }
      ]
    });

    // If userId is provided, include user's completion data
    if (userId) {
      const completions = await prismaClient.trainingCompletion.findMany({
        where: {
          userId,
          organizationId
        }
      });

      const programsWithCompletion = programs.map(program => {
        const completion = completions.find(c => c.programId === program.id);
        return {
          ...program,
          userCompletion: completion ? {
            status: completion.status,
            progress: completion.progress,
            score: completion.score
          } : null
        };
      });

      return NextResponse.json(programsWithCompletion);
    }

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, ...programData } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const program = await prismaClient.trainingProgram.create({
      data: {
        organizationId,
        ...programData
      }
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error creating training program:', error);
    return NextResponse.json(
      { error: 'Failed to create training program' },
      { status: 500 }
    );
  }
}
