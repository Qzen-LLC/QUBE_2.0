import React from 'react';
import RoadmapPosition from './RoadmapPosition';
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

interface ReadOnlyRoadmapPositionProps {
  data: {
    priority: string;
    projectStage: string;
    timelineConstraints: string[];
    timeline: string;
    dependencies: {
      dataPlatform: boolean;
      security: boolean;
      hiring: boolean;
    };
    metrics: string;
  };
  questions?: QnAProps[];
  questionsLoading?: boolean;
  questionAnswers?: Record<string, AnswerProps[]>;
  onAnswerChange?: (questionId: string, answers: AnswerProps[]) => void;
}

const ReadOnlyRoadmapPosition: React.FC<ReadOnlyRoadmapPositionProps> = ({ 
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
      <RoadmapPosition
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

export default ReadOnlyRoadmapPosition;
