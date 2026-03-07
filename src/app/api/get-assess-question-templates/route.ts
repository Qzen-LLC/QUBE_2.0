import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { withAuth } from '@/lib/auth-gateway';
import { verifyUseCaseAccess } from '@/lib/org-scope';

export const GET = withAuth(async (request: Request, { auth }) => {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const mode = searchParams.get('mode'); // 'quick' for Quick Assessment subset

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'useCaseId is required' },
        { status: 400 }
      );
    }

    if (!(await verifyUseCaseAccess(auth, useCaseId))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch question templates sorted by stage and orderIndex
    const templates = await prisma.questionTemplate.findMany({
      where: {
        isInactive: false,
        ...(mode === 'quick' ? { quickAssessment: true } : {}),
      },
      include: { optionTemplates: true },
      orderBy: [
        { stage: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    // Fetch answers for this use case
    const templateAnswers = await prisma.answer.findMany({
      where: {
        useCaseId,
        templateId: { not: null }
      },
    });

    const answersByTemplateId: Record<string, any[]> = {};
    templateAnswers.forEach(answer => {
      if (answer.templateId) {
        if (!answersByTemplateId[answer.templateId]) {
          answersByTemplateId[answer.templateId] = [];
        }
        answersByTemplateId[answer.templateId].push(answer);
      }
    });

    // Also fetch answers saved with questionId (in case org questions exist)
    const allAnswersForUseCase = await prisma.answer.findMany({
      where: { useCaseId },
      select: {
        id: true,
        questionId: true,
        templateId: true,
        value: true,
        score: true,
        priority: true,
        notes: true,
        ownerAction: true,
        costType: true,
        estMonthlyCost: true,
        estOneTimeCost: true,
      }
    });

    const orgQuestions = await prisma.question.findMany({
      where: {
        isInactive: false,
        templateId: { not: null }
      },
      select: { id: true, templateId: true }
    });

    const templateToQuestionMap: Record<string, string> = {};
    orgQuestions.forEach(q => {
      if (q.templateId) {
        templateToQuestionMap[q.templateId] = q.id;
      }
    });

    const answersByQuestionId: Record<string, any> = {};
    allAnswersForUseCase.forEach(answer => {
      if (answer.questionId) {
        answersByQuestionId[answer.questionId] = answer;
      }
    });

    const formattedTemplates = templates.map((template: any) => {
      const templateAnswerList = answersByTemplateId[template.id] || [];
      let answerRecord = templateAnswerList.length > 0 ? templateAnswerList[0] : null;
      let answerData = answerRecord?.value || null;

      // Fallback: try questionId
      if (!answerData && templateToQuestionMap[template.id]) {
        const questionId = templateToQuestionMap[template.id];
        const questionAnswer = answersByQuestionId[questionId];
        if (questionAnswer) {
          answerData = questionAnswer.value;
          answerRecord = questionAnswer;
        }
      }

      let answers: any[] = [];
      if (answerData) {
        if (answerData.optionIds && answerData.labels) {
          if (template.type === 'RISK') {
            const probLabel = answerData.labels.find((label: string) => label.startsWith('pro:'));
            const impactLabel = answerData.labels.find((label: string) => label.startsWith('imp:'));
            const probOptionId = answerData.optionIds[answerData.labels.findIndex((label: string) => label.startsWith('pro:'))];
            const impactOptionId = answerData.optionIds[answerData.labels.findIndex((label: string) => label.startsWith('imp:'))];
            if (probLabel && probOptionId) {
              answers.push({ id: `${template.id}-probability`, value: probLabel, questionId: template.id, optionId: probOptionId });
            }
            if (impactLabel && impactOptionId) {
              answers.push({ id: `${template.id}-impact`, value: impactLabel, questionId: template.id, optionId: impactOptionId });
            }
          } else {
            answers = answerData.optionIds.map((optionId: string, index: number) => ({
              id: `${template.id}-${optionId}`,
              value: answerData.labels[index],
              questionId: template.id,
              optionId: optionId,
            }));
          }
        } else if (answerData.text) {
          answers = [{ id: `${template.id}-${template.type.toLowerCase()}`, value: answerData.text, questionId: template.id }];
        }
      }

      return {
        id: template.id,
        text: template.text,
        type: template.type,
        stage: template.stage,
        subCategory: template.subCategory,
        aiAutomationTier: template.aiAutomationTier,
        aiAgentGuidance: template.aiAgentGuidance,
        questionNumber: template.questionNumber,
        options: template.optionTemplates.map((opt: any) => ({ id: opt.id, text: opt.text, questionId: template.id })),
        answers,
        score: answerRecord?.score ?? null,
        priority: answerRecord?.priority ?? null,
        notes: answerRecord?.notes ?? null,
        ownerAction: answerRecord?.ownerAction ?? null,
        costType: answerRecord?.costType ?? null,
        estMonthlyCost: answerRecord?.estMonthlyCost ?? null,
        estOneTimeCost: answerRecord?.estOneTimeCost ?? null,
      };
    });

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching question templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question templates' },
      { status: 500 }
    );
  }
});
