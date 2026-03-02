import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

// PUT /api/questions/[id] - Update a question
export const PUT = withAuth(async (req, { auth, params }: { auth: any, params: { id: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only ORG_ADMIN can update questions
    if (userRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
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

    // Check if question exists and belongs to user's organization
    const existingQuestion = await prismaClient.question.findFirst({
      where: {
        id,
        organizationId: userRecord.organizationId
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // For CHECKBOX and RADIO questions, options are required
    if ((type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) && (!options || options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for checkbox, radio and risk questions' },
        { status: 400 }
      );
    }

    // Update the question and its options
    const question = await prismaClient.$transaction(async (tx) => {
      // Delete existing options
      await tx.option.deleteMany({
        where: { questionId: id }
      });

      // Update the question
      const updatedQuestion = await tx.question.update({
        where: { id },
        data: {
          text,
          type,
          stage,
        }
      });

      // Create new options if needed
      if (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) {
        await tx.option.createMany({
          data: options
            .filter((opt: string) => opt.trim())
            .map((opt: string) => ({
              text: opt.trim(),
              questionId: id
            }))
        });
      }

      // Return the updated question with options
      return await tx.question.findUnique({
        where: { id },
        include: {
          options: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      question,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}, { requireUser: true });

// DELETE /api/questions/[id] - Delete a question
export const DELETE = withAuth(async (req, { auth, params }: { auth: any, params: { id: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only ORG_ADMIN can delete questions
    if (userRecord.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;

    // Check if question exists and belongs to user's organization
    const existingQuestion = await prismaClient.question.findFirst({
      where: {
        id,
        organizationId: userRecord.organizationId
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Delete the question (options will be deleted due to cascade)
    await prismaClient.question.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}, { requireUser: true });
