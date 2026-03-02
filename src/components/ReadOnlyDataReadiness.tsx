import React from 'react';
import DataReadiness from './DataReadiness';
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

type DataReadinessValue = {
  dataTypes: string[];
  dataVolume: string;
  growthRate: string;
  numRecords: string;
  primarySources: string[];
  dataQualityScore: number;
  dataCompleteness: number;
  dataAccuracyConfidence: number;
  dataFreshness: string;
  dataSubjectLocations: string;
  dataStorageLocations: string;
  dataProcessingLocations: string;
  crossBorderTransfer: boolean;
  dataLocalization: string;
  dataRetention: string;
};

interface ReadOnlyDataReadinessProps {
  data: DataReadinessValue;
  questions?: QnAProps[];
  questionsLoading?: boolean;
  questionAnswers?: Record<string, AnswerProps[]>;
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void;
}

const ReadOnlyDataReadiness: React.FC<ReadOnlyDataReadinessProps> = ({ 
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
      <DataReadiness
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

export default ReadOnlyDataReadiness;
