import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

// GET /api/questions - Get all questions for the user's organization
export const GET = withAuth(async (_req, { auth }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only ORG_ADMIN can access question configuration
    if (userRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch questions for the user's organization
    const questions = await prismaClient.question.findMany({
      where: { organizationId: userRecord.organizationId },
      include: {
        options: true,
      },
      orderBy: [
        { stage: 'asc' },
        { text: 'asc' }
      ]
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}, { requireUser: true });

// POST /api/questions - Create a new question
export const POST = withAuth(async (req, { auth }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only ORG_ADMIN can create questions
    if (userRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { text, type, stage, options } = await req.json();

    if (!text || !type || !stage) {
      return NextResponse.json(
        { error: 'Question text, type, and stage are required' },
        { status: 400 }
      );
    }

    // Validate question type
    if (!Object.values(QuestionType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid question type' },
        { status: 400 }
      );
    }

    // Validate stage
    if (!Object.values(Stage).includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    // For CHECKBOX and RADIO questions, options are required
    if ((type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) && (!options || options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for checkbox, radio and risk questions' },
        { status: 400 }
      );
    }

    // Create the question with options
    const question = await prismaClient.question.create({
      data: {
        text,
        type,
        stage,
        organizationId: userRecord.organizationId!,
        options: {
          create: (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK)
            ? options.filter((opt: string) => opt.trim()).map((opt: string) => ({ text: opt.trim() }))
            : []
        }
      },
      include: {
        options: true
      }
    });

    return NextResponse.json({
      success: true,
      question,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}, { requireUser: true });
