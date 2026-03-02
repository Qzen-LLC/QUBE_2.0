"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioGroupProps {
  label: string;
  options: OptionProps[];
  checkedOption: AnswerProps | null;
  onChange: (newChecked: AnswerProps | null) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

interface OptionProps {
  id: string;
  text: string;
  questionId: string;
}

interface AnswerProps {
  id: string;        
  value: string;     
  questionId: string;
  optionId?: string;  // Add optionId field
}

export function RadioGroupQuestion({
  label,
  options,
  checkedOption = null,
  onChange,
  disabled = false,
  readOnly = false,
}: RadioGroupProps) {
  // console.log('RadioGroupQuestion rendered with checkedOption:', checkedOption); // Debug log
  
  const handleValueChange = (value: string) => {
    if (disabled || readOnly) return;
    if (value) {
      // Find the option that matches the selected value
      const selectedOption = options.find(option => option.text === value);
      if (selectedOption) {
        const newAnswer: AnswerProps = {
          id: `${selectedOption.questionId}-${selectedOption.id}`,
          value: selectedOption.text,      
          questionId: selectedOption.questionId,
          optionId: selectedOption.id,  // Store the option ID
        };
        onChange(newAnswer);
      }
    } else {
      onChange(null);
    }
  };

  const isDisabled = disabled || readOnly;

  return (
    <div>
      <Label className="block font-medium mb-4 text-foreground">{label}</Label>
      <RadioGroup
        value={checkedOption?.value || ""}
        onValueChange={handleValueChange}
        disabled={isDisabled}
        className="space-y-3"
      >
        {options.map((option) => {
          // console.log(`Radio option ${option.text} is selected:`, checkedOption?.value === option.text); // Debug log
          
          return (
            <div key={`${option.questionId}-${option.id}`} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option.text} 
                id={`${option.questionId}-${option.id}`}
                disabled={isDisabled}
                style={readOnly ? { opacity: 1 } : undefined}
              />
              <Label 
                htmlFor={`${option.questionId}-${option.id}`}
                className={`text-sm text-foreground ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {option.text}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
