import React from 'react';
import RiskAssessment from './RiskAssessment';
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

interface ReadOnlyRiskAssessmentProps {
  data: {
    technicalRisks: { risk: string; probability: string; impact: string }[];
    businessRisks: { risk: string; probability: string; impact: string }[];
  };
  questions?: QnAProps[];
  questionsLoading?: boolean;
  questionAnswers?: Record<string, AnswerProps[]>;
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void;
}

const ReadOnlyRiskAssessment: React.FC<ReadOnlyRiskAssessmentProps> = ({ 
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
      <RiskAssessment
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

export default ReadOnlyRiskAssessment;
