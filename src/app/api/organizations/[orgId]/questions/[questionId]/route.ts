import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

// PUT /api/organizations/[orgId]/questions/[questionId] - Update a question
export const PUT = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ orgId: string; questionId: string }> }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orgId, questionId } = await params;

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can update questions for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === orgId) {
      // ORG_ADMIN can only update questions for their own organization
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { text, type, stage, options, isInactive, technicalOrderIndex, businessOrderIndex, ethicalOrderIndex, riskOrderIndex, dataOrderIndex, roadmapOrderIndex, budgetOrderIndex } = await req.json();

    // Check if this is a partial update (only order fields or isInactive field)
    const isPartialUpdate = (isInactive !== undefined && text === undefined && type === undefined && stage === undefined) ||
                           (technicalOrderIndex !== undefined || businessOrderIndex !== undefined || ethicalOrderIndex !== undefined ||
                            riskOrderIndex !== undefined || dataOrderIndex !== undefined || roadmapOrderIndex !== undefined ||
                            budgetOrderIndex !== undefined);

    if (!isPartialUpdate && (!text || !type || !stage)) {
      return NextResponse.json(
        { error: 'Question text, type, and stage are required' },
        { status: 400 }
      );
    }

    // Validate question type (only if provided)
    if (type !== undefined && !Object.values(QuestionType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid question type' },
        { status: 400 }
      );
    }

    // Validate stage (only if provided)
    if (stage !== undefined && !Object.values(Stage).includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      );
    }

    // Check if question exists and belongs to the specified organization
    const existingQuestion = await prismaClient.question.findFirst({
      where: {
        id: questionId,
        organizationId: orgId
      }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // For CHECKBOX and RADIO questions, options are required (only if type is being updated)
    if (type !== undefined && (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) && (!options || options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for checkbox, radio and risk questions' },
        { status: 400 }
      );
    }

    // Update the question and its options
    const question = await prismaClient.$transaction(async (tx) => {
      // Build update data object with only provided fields
      const updateData: any = {};
      if (text !== undefined) updateData.text = text;
      if (type !== undefined) updateData.type = type;
      if (stage !== undefined) updateData.stage = stage;
      if (isInactive !== undefined) updateData.isInactive = isInactive;
      if (technicalOrderIndex !== undefined) updateData.technicalOrderIndex = technicalOrderIndex;
      if (businessOrderIndex !== undefined) updateData.businessOrderIndex = businessOrderIndex;
      if (ethicalOrderIndex !== undefined) updateData.ethicalOrderIndex = ethicalOrderIndex;
      if (riskOrderIndex !== undefined) updateData.riskOrderIndex = riskOrderIndex;
      if (dataOrderIndex !== undefined) updateData.dataOrderIndex = dataOrderIndex;
      if (roadmapOrderIndex !== undefined) updateData.roadmapOrderIndex = roadmapOrderIndex;
      if (budgetOrderIndex !== undefined) updateData.budgetOrderIndex = budgetOrderIndex;

      // Update the question
      const updatedQuestion = await tx.question.update({
        where: { id: questionId },
        data: updateData
      });

      // Handle options only if type is being updated
      if (type !== undefined) {
        // Delete existing options
        await tx.option.deleteMany({
          where: { questionId }
        });

        // Create new options if needed
        if (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) {
          await tx.option.createMany({
            data: options
              .filter((opt: string) => opt.trim())
              .map((opt: string) => ({
                text: opt.trim(),
                questionId
              }))
          });
        }
      }

      // Return the updated question with options
      return await tx.question.findUnique({
        where: { id: questionId },
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

// DELETE /api/organizations/[orgId]/questions/[questionId] - Delete a question
export const DELETE = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ orgId: string; questionId: string }> }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orgId, questionId } = await params;

    // Check if organization exists
    const organization = await prismaClient.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can delete questions for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === orgId) {
      // ORG_ADMIN can only delete questions for their own organization
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if question exists and belongs to the specified organization
    const existingQuestion = await prismaClient.question.findFirst({
      where: {
        id: questionId,
        organizationId: orgId
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
      where: { id: questionId }
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
