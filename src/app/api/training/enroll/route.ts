import { NextRequest, NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programId, userId, organizationId } = body;

    if (!programId || !userId || !organizationId) {
      return NextResponse.json(
        { error: 'Program ID, User ID, and Organization ID are required' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existing = await prismaClient.trainingCompletion.findFirst({
      where: {
        programId,
        userId,
        organizationId
      }
    });

    if (existing) {
      // Update existing enrollment
      const updated = await prismaClient.trainingCompletion.update({
        where: { id: existing.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: existing.startedAt || new Date()
        }
      });
      return NextResponse.json(updated);
    }

    // Create new enrollment
    const completion = await prismaClient.trainingCompletion.create({
      data: {
        programId,
        userId,
        organizationId,
        status: 'IN_PROGRESS',
        progress: 0,
        startedAt: new Date()
      }
    });

    return NextResponse.json(completion);
  } catch (error) {
    console.error('Error enrolling in training:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in training program' },
      { status: 500 }
    );
  }
}
