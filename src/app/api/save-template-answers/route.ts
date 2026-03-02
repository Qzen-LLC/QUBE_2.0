import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    const { useCaseId, answers } = await request.json();

    if (!useCaseId || !answers) {
      return NextResponse.json(
        { error: 'useCaseId and answers are required' },
        { status: 400 }
      );
    }

    console.log('[Template Answers] Saving answers for templates:', answers);

    // Process each template's answers
    for (const [templateId, templateAnswers] of Object.entries(answers)) {
      if (Array.isArray(templateAnswers)) {
        // Always delete existing answer first, regardless of whether new answer is empty
        await prisma.answer.deleteMany({
          where: {
            templateId: templateId,
            useCaseId: useCaseId,
          },
        });
        
        // Only create a new answer if there's data to save
        if (templateAnswers.length > 0) {

        const firstAnswer = templateAnswers[0];
        
        // Check if this is a text-based question (TEXT, TEXT_MINI or SLIDER) - no optionId
        if (firstAnswer.optionId === undefined) {
          // For TEXT, TEXT_MINI and SLIDER questions, store the value directly
          console.log(`[Template Answers] Saving text-based answer for template ${templateId}:`, firstAnswer.value);
          await prisma.answer.create({
            data: {
              templateId: templateId,
              useCaseId: useCaseId,
              value: { text: firstAnswer.value }, // Store as { text: "answer" }
            },
          });
        } else {
          // For CHECKBOX and RADIO questions, extract option IDs and labels
          const optionIds = templateAnswers
            .map((answer: any) => answer.optionId)
            .filter((id: any) => id !== undefined && id !== null);
          
          const labels = templateAnswers
            .map((answer: any) => answer.label || answer.value) // fallback to value if label doesn't exist
            .filter((label: any) => label !== undefined && label !== null);

          // Only create answer if we have valid data
          if (optionIds.length > 0 && labels.length > 0) {
            console.log(`[Template Answers] Saving option-based answer for template ${templateId}:`, { optionIds, labels });
            await prisma.answer.create({
              data: {
                templateId: templateId,
                useCaseId: useCaseId,
                value: { optionIds, labels }, // Store as { optionIds: [], labels: [] }
              },
            });
          }
        }
        } else {
          // Log when answer is deleted due to empty selection
          console.log(`[Template Answers] Deleted answer for template ${templateId} - no selections made`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Template Answers] Error saving template answers:', error);
    return NextResponse.json(
      { error: 'Failed to save template answers' },
      { status: 500 }
    );
  }
}
