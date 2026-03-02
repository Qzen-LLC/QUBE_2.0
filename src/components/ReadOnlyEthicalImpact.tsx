import React from 'react';
import EthicalImpact from './EthicalImpact';
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

type EthicalImpactValue = {
  biasFairness: {
    historicalBias: boolean;
    demographicGaps: boolean;
    geographicBias: boolean;
    selectionBias: boolean;
    confirmationBias: boolean;
    temporalBias: boolean;
  };
  privacySecurity: {
    dataMinimization: boolean;
    consentManagement: boolean;
    dataAnonymization: boolean;
  };
  decisionMaking: {
    automationLevel: string;
    decisionTypes: string[];
  };
  modelCharacteristics: {
    explainabilityLevel: string;
    biasTesting: string;
  };
  aiGovernance: {
    humanOversightLevel: string;
    performanceMonitoring: string[];
  };
  ethicalConsiderations: {
    potentialHarmAreas: string[];
    vulnerablePopulations: string[];
  };
};

interface ReadOnlyEthicalImpactProps {
  data: EthicalImpactValue;
  questions?: QnAProps[]; // Optional - pass through to EthicalImpact
  questionsLoading?: boolean; // Optional - pass through to EthicalImpact
  questionAnswers?: Record<string, AnswerProps[]>; // Optional - pass through to EthicalImpact
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void; // Optional - pass through to EthicalImpact
}

const ReadOnlyEthicalImpact: React.FC<ReadOnlyEthicalImpactProps> = ({ 
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
      <EthicalImpact
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

export default ReadOnlyEthicalImpact; 