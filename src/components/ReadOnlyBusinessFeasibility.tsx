import React from 'react';
import BusinessFeasibility from './BusinessFeasibility';
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

type BusinessFeasibilityProps = {
  value: {
    strategicAlignment: number;
    marketOpportunity: string;
    stakeholder: {
      exec: boolean;
      endUser: boolean;
      it: boolean;
    };
    annualSavings: string;
    efficiencyGain: number;
    paybackPeriod: number;
    availabilityRequirement: string;
    responseTimeRequirement: string;
    concurrentUsers: string;
    revenueImpactType: string;
    estimatedFinancialImpact: string;
    userCategories: string[];
    systemCriticality: string;
    failureImpact: string;
    executiveSponsorLevel: string;
    stakeholderGroups: string[];
  };
  onChange: (data: BusinessFeasibilityProps['value']) => void;
};

interface ReadOnlyBusinessFeasibilityProps {
  data: BusinessFeasibilityProps['value'];
  questions?: QnAProps[]; // Optional - pass through to BusinessFeasibility
  questionsLoading?: boolean; // Optional - pass through to BusinessFeasibility
  questionAnswers?: Record<string, AnswerProps[]>; // Optional - pass through to BusinessFeasibility
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void; // Optional - pass through to BusinessFeasibility
}

const ReadOnlyBusinessFeasibility: React.FC<ReadOnlyBusinessFeasibilityProps> = ({ 
  data, 
  questions = [], 
  questionsLoading = false, 
  questionAnswers = {}, 
  onAnswerChange 
}) => {
  // Create a no-op onChange function that does nothing
  const noOpOnChange = () => {
    // This function does nothing - prevents any changes
  };

  // Create a no-op onAnswerChange function if not provided
  const noOpOnAnswerChange = onAnswerChange || (() => {
    // This function does nothing - prevents any changes
  });

  return (
    <div className="read-only-mode">
      <BusinessFeasibility
        value={data}
        onChange={noOpOnChange}
        questions={questions}
        questionsLoading={questionsLoading}
        questionAnswers={questionAnswers}
        onAnswerChange={noOpOnAnswerChange}
        readOnly={true}
      />
    </div>
  );
};

export default ReadOnlyBusinessFeasibility; 