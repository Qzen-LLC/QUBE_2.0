import { NextResponse } from 'next/server';
import { prismaClient } from '@/utils/db';
import { QuestionType, Stage } from '@/generated/prisma';
import { withAuth } from '@/lib/auth-gateway';

// PUT /api/question-templates/[questionTemplateId] - Update a question template
export const PUT = withAuth(async (req, { auth, params }: { auth: any, params: { questionTemplateId: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { questionTemplateId } = params;

    // Check permissions
    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { text, type, stage, optionTemplates, isInactive, technicalOrderIndex, businessOrderIndex, ethicalOrderIndex, riskOrderIndex, dataOrderIndex, roadmapOrderIndex, budgetOrderIndex } = await req.json();

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

    // Check if question template exists
    const existingQuestionTemplate = await prismaClient.questionTemplate.findUnique({
      where: {
        id: questionTemplateId,
      }
    });

    if (!existingQuestionTemplate) {
      return NextResponse.json(
        { error: 'Question template not found' },
        { status: 404 }
      );
    }

    // For CHECKBOX and RADIO questions, options are required (only if type is being updated)
    if (type !== undefined && (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) && (!optionTemplates || optionTemplates.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for checkbox, radio and risk questions' },
        { status: 400 }
      );
    }

    // Update the question template and its options
    const questionTemplate = await prismaClient.$transaction(async (tx) => {
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

      // Update the question template
      const updatedQuestionTemplate = await tx.questionTemplate.update({
        where: { id: questionTemplateId },
        data: updateData
      });

      // Handle options only if type is being updated
      if (type !== undefined) {
        // Delete existing options
        await tx.optionTemplate.deleteMany({
          where: { questionTemplateId }
        });

        // Create new options if needed
        if (type === QuestionType.CHECKBOX || type === QuestionType.RADIO || type === QuestionType.RISK) {
          await tx.optionTemplate.createMany({
            data: optionTemplates
              .filter((opt: string) => opt.trim())
              .map((opt: string) => ({
                text: opt.trim(),
                questionTemplateId
              }))
          });
        }
      }

      // Return the updated question template with options
      return await tx.questionTemplate.findUnique({
        where: { id: questionTemplateId },
        include: {
          optionTemplates: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      questionTemplate,
      message: 'Question template updated successfully'
    });
  } catch (error) {
    console.error('Error updating question template:', error);
    return NextResponse.json(
      { error: 'Failed to update question template' },
      { status: 500 }
    );
  }
}, { requireUser: true });

// DELETE /api/question-templates/[questionTemplateId] - Delete a question template
export const DELETE = withAuth(async (req, { auth, params }: { auth: any, params: { questionTemplateId: string } }) => {
  try {
    const clerkId = auth.userId!;

    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { questionTemplateId } = params;

    // Check permissions
    if (userRecord.role !== 'QZEN_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if question template exists
    const existingQuestionTemplate = await prismaClient.questionTemplate.findUnique({
      where: {
        id: questionTemplateId,
      }
    });

    if (!existingQuestionTemplate) {
      return NextResponse.json(
        { error: 'Question template not found' },
        { status: 404 }
      );
    }

    // Delete the question template (options will be deleted due to cascade)
    await prismaClient.questionTemplate.delete({
      where: { id: questionTemplateId }
    });

    return NextResponse.json({
      success: true,
      message: 'Question template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question template:', error);
    return NextResponse.json(
      { error: 'Failed to delete question template' },
      { status: 500 }
    );
  }
}, { requireUser: true });
