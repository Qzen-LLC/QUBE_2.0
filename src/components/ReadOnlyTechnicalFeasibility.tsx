import React from 'react';
import TechnicalFeasibility from './TechnicalFeasibility';
import { ensureCompatibility } from '@/lib/assessment/field-mapper';
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

interface ReadOnlyTechnicalFeasibilityProps {
  data: any; // Accept any format for backward compatibility
  questions?: QnAProps[]; // Optional - pass through to TechnicalFeasibility
  questionsLoading?: boolean; // Optional - pass through to TechnicalFeasibility
  questionAnswers?: Record<string, AnswerProps[]>; // Optional - pass through to TechnicalFeasibility
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void; // Optional - pass through to TechnicalFeasibility
}

const ReadOnlyTechnicalFeasibility: React.FC<ReadOnlyTechnicalFeasibilityProps> = ({ 
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

  // Ensure the data is in UI format for display
  const compatibleData = ensureCompatibility({ technicalFeasibility: data }).technicalFeasibility || data;

  return (
    <div className="read-only-mode">
      <TechnicalFeasibility
        value={compatibleData}
        onChange={noOpOnChange}
        questions={questions}
        questionsLoading={questionsLoading}
        questionAnswers={questionAnswers}
        onAnswerChange={noOpOnAnswerChange}
      />
    </div>
  );
};

export default ReadOnlyTechnicalFeasibility; 