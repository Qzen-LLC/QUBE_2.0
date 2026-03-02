import React from 'react';
import BudgetPlanning from './BudgetPlanning';
import { PrismaClient } from '@/generated/prisma';

interface QnAProps {
  id: string,
  text: string,
  type: any,
  stage: any,
  options: any[],
  answers: any[],
}

interface AnswerProps {
  id: string,
  value: string,
  questionId: string,
  optionId?: string,
}

interface BudgetPlanningProps {
  value: {
    initialDevCost: number;
    baseApiCost: number;
    baseInfraCost: number;
    baseOpCost: number;
    baseMonthlyValue: number;
    valueGrowthRate: number;
    budgetRange: string;
    error?: string;
    loading?: boolean;
  };
  onChange: (data: BudgetPlanningProps['value']) => void;
}

interface ReadOnlyBudgetPlanningProps {
  data: BudgetPlanningProps['value'];
  questions?: QnAProps[];
  questionsLoading?: boolean;
  questionAnswers?: Record<string, AnswerProps[]>;
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void;
}

const ReadOnlyBudgetPlanning: React.FC<ReadOnlyBudgetPlanningProps> = ({ 
  data, 
  questions = [], 
  questionsLoading = false, 
  questionAnswers = {}, 
  onAnswerChange 
}) => {
  const noOpOnChange = () => {};
  const noOpOnAnswerChange = onAnswerChange || (() => {});

  return (
    <div className="read-only-mode">
      <BudgetPlanning
        value={data}
        onChange={noOpOnChange}
        questions={questions}
        questionsLoading={questionsLoading}
        questionAnswers={questionAnswers}
        onAnswerChange={noOpOnAnswerChange}
      />
    </div>
  );
};

export default ReadOnlyBudgetPlanning;
