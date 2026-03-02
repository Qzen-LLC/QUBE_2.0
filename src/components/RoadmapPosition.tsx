import React, { useEffect, useState } from 'react';
import {
  Checkbox
} from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, Server, Plug, Shield as ShieldIcon, Check } from 'lucide-react';
import { PrismaClient, QuestionType, Stage } from '@/generated/prisma';
import { CheckboxGroup } from './questionComps/checkboxQuestion';
import { RadioGroupQuestion } from './questionComps/radioQuestion';
import { SliderQuestion } from './questionComps/SliderQuestion';
import { TextQuestion } from './questionComps/TextQuestion';
import { useAnswerHandlers } from '@/lib/handle-assess-ui';
import { RiskQuestion } from './questionComps/riskQuestion';
import { TextMiniQuestion } from './questionComps/TextMiniQuestion';
interface QnAProps {
  id: string,
  text: string,
  type: QuestionType,
  stage: Stage,
  options: OptionProps[],
  answers: AnswerProps[], // This will now contain all answers for the question
}

interface OptionProps {
  id: string,
  text: string,
  questionId: string,
}

interface AnswerProps {
  id: string;        
  value: string;     
  questionId: string;
  optionId?: string;  // Make optionId optional since TEXT and SLIDER don't have options
}

type Props = {
  value: {
    modelTypes: string[];
    modelSizes: string[];
    deploymentModels: string[];
    cloudProviders: string[];
    computeRequirements: string[];
    integrationPoints: string[];
    apiSpecs: string[];
    authMethods: string[];
    encryptionStandards: string[];
    technicalComplexity: number;
    outputTypes: string[];
    confidenceScore: string;
    modelUpdateFrequency: string;
  };
  onChange: (data: Props['value']) => void;
  questions: QnAProps[];
  questionsLoading: boolean;
  questionAnswers: Record<string, AnswerProps[]>;
  onAnswerChange: (questionId: string, answers: AnswerProps[]) => void;
};

export default function RoadmapPosition({ value, onChange, questions, questionsLoading, questionAnswers, onAnswerChange }: Props) {
  // CRITICAL: Early return if props are undefined
  if (questions === undefined || questionsLoading === undefined) {
    console.warn('[RoadmapPosition] Received undefined props - showing loader.');
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading questions...</span>
      </div>
    );
  }

  const { handleCheckboxChange, handleRadioChange, handleSliderChange, handleTextChange, handleTextMiniChange, handleRiskGroupChange } = useAnswerHandlers(onAnswerChange);

  return (
    <div className="space-y-10">
      <div className="bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-l-4 border-primary p-4 mb-8 rounded-2xl flex items-center gap-3 shadow-md">
        <div className="font-semibold text-foreground text-lg mb-1">Roadmap Position Assessment</div>
        <div className="text-muted-foreground">Evaluate the roadmap position and constraints for implementing this AI solution.</div>
      </div>
      
      {questionsLoading || !questions ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading questions...</span>
        </div>
      ) : (
        questions.map((q) => {
          const currentAnswers = questionAnswers[q.id] || q.answers || [];
          
          // console.log(`Question ${q.id} answers:`, currentAnswers);
          
          if (q.stage === Stage.ROADMAP_POSITION) {
            if (q.type === QuestionType.CHECKBOX) {
              return (
                <CheckboxGroup
                  key={q.id}
                  label={q.text}
                  options={q.options}
                  checkedOptions={currentAnswers}
                  onChange={(newAnswers) => handleCheckboxChange(q.id, newAnswers)}
                />
              );
            } else if (q.type === QuestionType.RADIO) {
              const checkedOption = currentAnswers.length > 0 ? currentAnswers[0] : null;
              
              return (
                <RadioGroupQuestion
                  key={q.id}
                  label={q.text}
                  options={q.options}
                  checkedOption={checkedOption}
                  onChange={(newAnswer) => handleRadioChange(q.id, newAnswer)}
                />
              );
            } else if (q.type === QuestionType.SLIDER) {
              const currentValue = currentAnswers.length > 0 ? parseInt(currentAnswers[0].value) || 0 : 0;
              
              return (
                <SliderQuestion
                  key={q.id}
                  label={q.text}
                  value={currentValue}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(newValue) => handleSliderChange(q.id, newValue)}
                />
              );
            } else if (q.type === QuestionType.TEXT) {
              const currentValue = currentAnswers.length > 0 ? currentAnswers[0].value : '';
              
              return (
                <TextQuestion
                  key={q.id}
                  label={q.text}
                  value={currentValue}
                  placeholder="Enter your answer..."
                  onChange={(newValue) => handleTextChange(q.id, newValue)}
                />
              );
            } else if (q.type === QuestionType.TEXT_MINI) {
              const currentValue = currentAnswers.length > 0 ? currentAnswers[0].value : '';
              
              return (
                <TextMiniQuestion
                  key={q.id}
                  label={q.text}
                  value={currentValue}
                  placeholder="Enter your answer..."
                  onChange={(newValue) => handleTextMiniChange(q.id, newValue)}
                />
              );
            } else if (q.type === QuestionType.RISK) {
              // Filter options by prefix for RISK questions
              const probabilityOptions = q.options.filter(opt => opt.text.startsWith("pro:"));
              const impactOptions = q.options.filter(opt => opt.text.startsWith("imp:"));
              
              // Get current answers - RISK questions store both probability and impact in a single answer
              const riskAnswer = currentAnswers.length > 0 ? currentAnswers[0] : null;
              
              // For RISK questions, find the individual probability and impact answers
              // These come as separate answers from the backend
              let probabilityAnswer = null;
              let impactAnswer = null;
              
              // Look for probability and impact answers in the current answers
              const probAnswer = currentAnswers.find(a => a.id.includes('probability'));
              const impAnswer = currentAnswers.find(a => a.id.includes('impact'));
              
              console.log('RISK Question Debug:', {
                questionId: q.id,
                currentAnswers,
                probAnswer,
                impAnswer
              });
              
              if (probAnswer) {
                // Remove prefix for display (handle both cases)
                const cleanValue = probAnswer.value.startsWith('pro:') 
                  ? probAnswer.value.replace(/^pro:/, '') 
                  : probAnswer.value;
                probabilityAnswer = {
                  id: probAnswer.id,
                  value: cleanValue, // Clean string like "LOW" for display
                  questionId: probAnswer.questionId,
                  optionId: probAnswer.optionId
                };
              }
              
              if (impAnswer) {
                // Remove prefix for display (handle both cases)
                const cleanValue = impAnswer.value.startsWith('imp:') 
                  ? impAnswer.value.replace(/^imp:/, '') 
                  : impAnswer.value;
                impactAnswer = {
                  id: impAnswer.id,
                  value: cleanValue, // Clean string like "HIGH" for display
                  questionId: impAnswer.questionId,
                  optionId: impAnswer.optionId
                };
              }
            
              return (
                <RiskQuestion
                  key={q.id}
                  label={q.text}
                  probabilityOptions={probabilityOptions}
                  impactOptions={impactOptions}
                  checkedAnswers={{
                    probability: probabilityAnswer,
                    impact: impactAnswer
                  }}
                  onChange={(newChecked) => handleRiskGroupChange(q.id, newChecked)}
                />
              );
            }
          }
          return null;
        })
      )}
    </div>
  );
} 