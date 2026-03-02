import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { syncFinOpsFromAssessment } from '@/lib/finops-aggregator';

export async function POST(request: NextRequest) {
  try {
    const { useCaseId, answers } = await request.json();

    if (!useCaseId || !answers) {
      return NextResponse.json(
        { error: 'useCaseId and answers are required' },
        { status: 400 }
      );
    }

    // Process each question's answers
    for (const [questionOrTemplateId, questionAnswers] of Object.entries(answers)) {
      if (Array.isArray(questionAnswers)) {
        // Check if this is a questionId or templateId
        const isQuestion = await prisma.question.findUnique({
          where: { id: questionOrTemplateId },
          select: { id: true }
        });

        const isTemplate = !isQuestion && await prisma.questionTemplate.findUnique({
          where: { id: questionOrTemplateId },
          select: { id: true }
        });

        if (!isQuestion && !isTemplate) {
          console.warn(`Warning: ID ${questionOrTemplateId} not found in Question or QuestionTemplate tables. Skipping...`);
          continue;
        }

        const idField = isQuestion ? 'questionId' : 'templateId';

        // Always delete existing answer first
        await prisma.answer.deleteMany({
          where: {
            [idField]: questionOrTemplateId,
            useCaseId: useCaseId,
          },
        });

        // Only create a new answer if there's data to save
        if (questionAnswers.length > 0) {
          const firstAnswer = questionAnswers[0] as any;

          // Extract enriched fields from the first answer
          const enrichedFields: any = {};
          if (firstAnswer.score !== undefined && firstAnswer.score !== null) enrichedFields.score = Number(firstAnswer.score);
          if (firstAnswer.priority !== undefined) enrichedFields.priority = firstAnswer.priority;
          if (firstAnswer.notes !== undefined) enrichedFields.notes = firstAnswer.notes;
          if (firstAnswer.ownerAction !== undefined) enrichedFields.ownerAction = firstAnswer.ownerAction;
          if (firstAnswer.costType !== undefined) enrichedFields.costType = firstAnswer.costType;
          if (firstAnswer.estMonthlyCost !== undefined && firstAnswer.estMonthlyCost !== null) enrichedFields.estMonthlyCost = Number(firstAnswer.estMonthlyCost);
          if (firstAnswer.estOneTimeCost !== undefined && firstAnswer.estOneTimeCost !== null) enrichedFields.estOneTimeCost = Number(firstAnswer.estOneTimeCost);

          if (firstAnswer.optionId === undefined) {
            // For TEXT, TEXT_MINI and SLIDER questions
            await prisma.answer.create({
              data: {
                [idField]: questionOrTemplateId,
                useCaseId: useCaseId,
                value: { text: firstAnswer.value },
                ...enrichedFields,
              },
            });
          } else {
            // For CHECKBOX and RADIO questions
            const optionIds = (questionAnswers as any[])
              .map((answer: any) => answer.optionId)
              .filter((id: any) => id !== undefined && id !== null);

            const labels = (questionAnswers as any[])
              .map((answer: any) => answer.label || answer.value)
              .filter((label: any) => label !== undefined && label !== null);

            if (optionIds.length > 0 && labels.length > 0) {
              await prisma.answer.create({
                data: {
                  [idField]: questionOrTemplateId,
                  useCaseId: useCaseId,
                  value: { optionIds, labels },
                  ...enrichedFields,
                },
              });
            }
          }
        }
      }
    }

    // Auto-aggregate FinOps data if any saved answer belongs to FINOPS stage
    try {
      const templateIds = Object.keys(answers);
      const finopsCount = await prisma.questionTemplate.count({
        where: { id: { in: templateIds }, stage: 'FINOPS' },
      });
      if (finopsCount === 0) {
        // Also check via Question table (questions linked to FINOPS templates)
        const questionFinopsCount = await prisma.question.count({
          where: { id: { in: templateIds }, template: { stage: 'FINOPS' } },
        });
        if (questionFinopsCount > 0) {
          await syncFinOpsFromAssessment(useCaseId);
        }
      } else {
        await syncFinOpsFromAssessment(useCaseId);
      }
    } catch (aggErr) {
      // Aggregation failures must never block answer saving
      console.error('FinOps aggregation failed (non-blocking):', aggErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving question answers:', error);
    return NextResponse.json(
      { error: 'Failed to save question answers' },
      { status: 500 }
    );
  }
}
