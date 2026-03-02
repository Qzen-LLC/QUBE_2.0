import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

// GET /api/organizations/[orgId]/questions - Get all questions for a specific organization
export const GET = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ orgId: string }> }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orgId } = await params;

    // Validate orgId
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can access any organization's questions
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === orgId) {
      // ORG_ADMIN can only access their own organization's questions
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch questions for the specified organization
    const questions = await prismaClient.question.findMany({
      where: { organizationId: orgId },
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

// POST /api/organizations/[orgId]/questions - Create a new question for a specific organization
export const POST = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ orgId: string }> }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orgId } = await params;

    // Validate orgId
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can create questions for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === orgId) {
      // ORG_ADMIN can only create questions for their own organization
    } else {
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
        organizationId: orgId,
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
