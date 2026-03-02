import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

export const GET = withAuth(async (_req, { auth }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const questionTemplates = await prismaClient.questionTemplate.findMany({
      include: {
        optionTemplates: true,
      },
      orderBy: [
        { stage: 'asc' },
        { text: 'asc' }
      ]
    });

    return NextResponse.json({ questionTemplates });
  } catch (error) {
    console.error('Error fetching question templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question templates' },
      { status: 500 }
    );
  }
}, { requireUser: true });

export const POST = withAuth(async (req, { auth }) => {
  try {
    console.log("POST request received");
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { text, type, stage, optionTemplates } = await req.json();

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

    if ((type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) && (!optionTemplates || optionTemplates.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for checkbox, radio and risk questions' },
        { status: 400 }
      );
    }

    const questionTemplate = await prismaClient.questionTemplate.create({
      data: {
        text,
        type,
        stage,
        optionTemplates: {
          create: (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK)
            ? optionTemplates.filter((opt: string) => opt.trim()).map((opt: string) => ({ text: opt.trim() }))
            : []
        }
      },
      include: {
        optionTemplates: true
      }
    });

    return NextResponse.json({
      success: true,
      questionTemplate,
      message: 'Question template created successfully'
    });
  } catch (error) {
    console.error('Error creating question template:', error);
    return NextResponse.json(
      { error: 'Failed to create question template' },
      { status: 500 }
    );
  }
}, { requireUser: true });
