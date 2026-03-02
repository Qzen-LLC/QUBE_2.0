import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useCaseId = searchParams.get('useCaseId');
    const mode = searchParams.get('mode'); // 'quick' for Quick Assessment subset, 'core' for Core+Expand

    if (!useCaseId) {
      return NextResponse.json(
        { error: 'useCaseId is required' },
        { status: 400 }
      );
    }

    // Get the organization ID from the use case
    const useCase = await prisma.useCase.findUnique({
      where: { id: useCaseId },
      select: { organizationId: true }
    });

    if (!useCase) {
      return NextResponse.json(
        { error: 'Use case not found' },
        { status: 404 }
      );
    }

    // Get all answers for this use case (needed for fallback lookup)
    const allAnswersForUseCase = await prisma.answer.findMany({
      where: { useCaseId },
      select: {
        id: true,
        questionId: true,
        templateId: true,
        useCaseId: true,
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

    // Fetch questions with options and answers
    const modeFilter = mode === 'quick'
      ? { quickAssessment: true }
      : mode === 'core'
        ? { coreQuestion: true }
        : {};

    let questions = await prisma.question.findMany({
      where: {
        organizationId: useCase.organizationId || undefined,
        isInactive: false,
        ...modeFilter,
      },
      include: {
        options: true,
        answers: {
          where: { useCaseId },
        },
      },
    });

    // Fallback: if no org-specific questions are configured, use templates
    if (!questions || questions.length === 0) {
      const templateModeFilter = mode === 'quick'
        ? { quickAssessment: true }
        : mode === 'core'
          ? { coreQuestion: true }
          : {};

      const templates = await prisma.questionTemplate.findMany({
        where: {
          isInactive: false,
          ...templateModeFilter,
        },
        include: { optionTemplates: true },
        orderBy: [
          { stage: 'asc' },
          { orderIndex: 'asc' },
        ],
      });

      const templateAnswers = await prisma.answer.findMany({
        where: { useCaseId, templateId: { not: null } },
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

      const formattedTemplates = templates.map((template: any) => {
        const answerList = answersByTemplateId[template.id] || [];
        const answerRecord = answerList.length > 0 ? answerList[0] : null;
        const answerData = answerRecord?.value || null;

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
                optionId,
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
          // Include enriched answer fields
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
    }

    // Sort questions by stage and orderIndex
    questions.sort((a, b) => {
      if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    // Transform the data to match the expected format
    const formattedQuestions = questions.map((q: any) => {
      let answerData = q.answers.length > 0 ? q.answers[0].value : null;
      const answerRecord = q.answers.length > 0 ? q.answers[0] : null;

      // Fallback: try templateId
      if (!answerData && q.templateId) {
        const templateAnswer = allAnswersForUseCase.find((a: any) => a.templateId === q.templateId);
        if (templateAnswer) {
          answerData = templateAnswer.value;
        }
      }

      let answers: any[] = [];
      if (answerData) {
        if (answerData.optionIds && answerData.labels) {
          if (q.type === 'RISK') {
            const probLabel = answerData.labels.find((label: string) => label.startsWith('pro:'));
            const impactLabel = answerData.labels.find((label: string) => label.startsWith('imp:'));
            const probOptionId = answerData.optionIds[answerData.labels.findIndex((label: string) => label.startsWith('pro:'))];
            const impactOptionId = answerData.optionIds[answerData.labels.findIndex((label: string) => label.startsWith('imp:'))];
            if (probLabel && probOptionId) {
              answers.push({ id: `${q.id}-probability`, value: probLabel, questionId: q.id, optionId: probOptionId });
            }
            if (impactLabel && impactOptionId) {
              answers.push({ id: `${q.id}-impact`, value: impactLabel, questionId: q.id, optionId: impactOptionId });
            }
          } else {
            answers = answerData.optionIds.map((optionId: string, index: number) => ({
              id: `${q.id}-${optionId}`,
              value: answerData.labels[index],
              questionId: q.id,
              optionId: optionId,
            }));
          }
        } else if (answerData.text) {
          answers = [{ id: `${q.id}-${q.type.toLowerCase()}`, value: answerData.text, questionId: q.id }];
        }
      }

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        stage: q.stage,
        subCategory: q.subCategory,
        aiAutomationTier: q.aiAutomationTier,
        aiAgentGuidance: q.aiAgentGuidance,
        questionNumber: q.questionNumber,
        options: q.options.map((o: any) => ({ id: o.id, text: o.text, questionId: q.id })),
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

    return NextResponse.json(formattedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
