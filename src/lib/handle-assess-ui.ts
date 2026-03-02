// hooks/useAnswerHandlers.ts
import { useCallback } from "react";

export interface AnswerProps {
  id: string;
  value: string;
  questionId: string;
  optionId?: string;
}

export const useAnswerHandlers = (
  onAnswerChange: (questionId: string, answers: AnswerProps[]) => void
) => {
  const handleCheckboxChange = useCallback(
    (questionId: string, newAnswers: AnswerProps[]) => {
      console.log("Checkbox changed for question:", questionId, newAnswers);
      onAnswerChange(questionId, newAnswers);
    },
    [onAnswerChange]
  );

  const handleRadioChange = useCallback(
    (questionId: string, newAnswer: AnswerProps | null) => {
      console.log("Radio changed for question:", questionId, newAnswer);
      onAnswerChange(questionId, newAnswer ? [newAnswer] : []);
    },
    [onAnswerChange]
  );

  const handleSliderChange = useCallback(
    (questionId: string, newValue: number) => {
      console.log("Slider changed for question:", questionId, newValue);
      onAnswerChange(questionId, [
        { id: `${questionId}-slider`, value: newValue.toString(), questionId },
      ]);
    },
    [onAnswerChange]
  );

  const handleTextChange = useCallback(
    (questionId: string, newValue: string) => {
      console.log("Text changed for question:", questionId, newValue);
      onAnswerChange(questionId, [
        { id: `${questionId}-text`, value: newValue, questionId },
      ]);
    },
    [onAnswerChange]
  );

  const handleTextMiniChange = useCallback(
    (questionId: string, newValue: string) => {
      console.log("Mini Text changed for question:", questionId, newValue);
      onAnswerChange(questionId, [
        { id: `${questionId}-textmini`, value: newValue, questionId },
      ]);
    },
    [onAnswerChange]
  );

  const handleRiskGroupChange = useCallback(
    (
      questionId: string,
      newChecked: { probability: AnswerProps | null; impact: AnswerProps | null }
    ) => {
      // Send individual answers like checkbox/radio questions
      // The backend will construct the labels and optionIds arrays
      const answers: AnswerProps[] = [];

      if (newChecked.probability) {
        console.log("Adding probability answer:", newChecked.probability);
        answers.push(newChecked.probability);
      }

      if (newChecked.impact) {
        console.log("Adding impact answer:", newChecked.impact);
        answers.push(newChecked.impact);
      }

      console.log("Risk group changed for question:", questionId, answers);
      onAnswerChange(questionId, answers);
    },
    [onAnswerChange]
  );

  return { handleCheckboxChange, handleRadioChange, handleSliderChange, handleTextChange, handleTextMiniChange, handleRiskGroupChange };
};
