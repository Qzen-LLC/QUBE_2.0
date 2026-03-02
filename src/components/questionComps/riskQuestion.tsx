"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OptionProps {
  id: string;
  text: string; // prefixed with "pro:" or "imp:"
  questionId: string;
}

interface AnswerProps {
  id: string;
  value: string; // JSONB string like { "optionId": "uuid", "label": "Low" }
  questionId: string;
  optionId?: string;
}

interface RiskQuestionProps {
  label: string;
  probabilityOptions: OptionProps[];
  impactOptions: OptionProps[];
  checkedAnswers: {
    probability: AnswerProps | null;
    impact: AnswerProps | null;
  };
  onChange: (newChecked: {
    probability: AnswerProps | null;
    impact: AnswerProps | null;
  }) => void;
}

export function RiskQuestion({
  label,
  probabilityOptions,
  impactOptions,
  checkedAnswers,
  onChange,
}: RiskQuestionProps) {
  const handleProbabilityChange = (optionId: string) => {
    const selected = probabilityOptions.find((o) => o.id === optionId);
    if (selected) {
      const cleanLabel = selected.text.replace(/^pro:/, "");
      const prefixedValue = `pro:${cleanLabel}`;
      
      console.log('Probability change:', {
        selected,
        cleanLabel,
        prefixedValue,
        optionId,
        currentImpact: checkedAnswers.impact
      });
      
      // Ensure impact has prefix if it exists
      const impactAnswer = checkedAnswers.impact ? {
        ...checkedAnswers.impact,
        value: checkedAnswers.impact.value.startsWith('imp:') 
          ? checkedAnswers.impact.value 
          : `imp:${checkedAnswers.impact.value}`
      } : null;
      
      onChange({
        probability: {
          id: `${selected.questionId}-probability`,
          value: prefixedValue, // Add prefix in frontend
          questionId: selected.questionId,
          optionId: selected.id,
        },
        impact: impactAnswer
      });
    }
  };

  const handleImpactChange = (optionId: string) => {
    const selected = impactOptions.find((o) => o.id === optionId);
    if (selected) {
      const cleanLabel = selected.text.replace(/^imp:/, "");
      const prefixedValue = `imp:${cleanLabel}`;
      
      console.log('Impact change:', {
        selected,
        cleanLabel,
        prefixedValue,
        optionId,
        currentProbability: checkedAnswers.probability
      });
      
      // Ensure probability has prefix if it exists
      const probabilityAnswer = checkedAnswers.probability ? {
        ...checkedAnswers.probability,
        value: checkedAnswers.probability.value.startsWith('pro:') 
          ? checkedAnswers.probability.value 
          : `pro:${checkedAnswers.probability.value}`
      } : null;
      
      onChange({
        probability: probabilityAnswer,
        impact: {
          id: `${selected.questionId}-impact`,
          value: prefixedValue, // Add prefix in frontend
          questionId: selected.questionId,
          optionId: selected.id,
        }
      });
    }
  };

  // Extract stored values for select
  const probabilityValue = checkedAnswers.probability?.optionId || "";
  const impactValue = checkedAnswers.impact?.optionId || "";

  return (
    <div>
      <Label className="block font-medium mb-4 text-foreground">{label}</Label>
      <div className="flex gap-8">
        {/* Probability Select */}
        <div className="flex flex-col gap-2">
          <Label>Probability</Label>
          <Select
            value={probabilityValue}
            onValueChange={handleProbabilityChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select probability" />
            </SelectTrigger>
            <SelectContent>
              {probabilityOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.text.replace(/^pro:/, "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Impact Select */}
        <div className="flex flex-col gap-2">
          <Label>Impact</Label>
          <Select value={impactValue} onValueChange={handleImpactChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select impact" />
            </SelectTrigger>
            <SelectContent>
              {impactOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.text.replace(/^imp:/, "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
