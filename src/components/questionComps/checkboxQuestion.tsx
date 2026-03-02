"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxGroupProps {
  label: string;
  options: OptionProps[];
  checkedOptions: AnswerProps[];
  onChange: (newChecked: AnswerProps[]) => void;
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

export function CheckboxGroup({
  label,
  options,
  checkedOptions = [],
  onChange,
  disabled = false,
  readOnly = false,
}: CheckboxGroupProps) {
  // console.log('CheckboxGroup rendered with checkedOptions:', checkedOptions); // Debug log
  
  const toggleOption = (option: OptionProps, isChecked: boolean) => {
    if (disabled || readOnly) return;
    if (isChecked) {
      const newAnswer: AnswerProps = {
        id: `${option.questionId}-${option.id}`,
        value: option.text,      
        questionId: option.questionId,
        optionId: option.id,  // Store the option ID
      };
      onChange([...checkedOptions, newAnswer]);
    } else {
      onChange(checkedOptions.filter((a) => a.optionId !== option.id)); // Match by optionId
    }
  };

  const isDisabled = disabled || readOnly;

  return (
    <div>
      <Label className="block font-medium mb-4 text-foreground">{label}</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => {
          // Match by optionId instead of value
          const isChecked = checkedOptions.some((a) => a.optionId === option.id);
          // console.log(`Option ${option.text} is checked:`, isChecked, 'checkedOptions:', checkedOptions); // Debug log
          
          return (
            <Label
              key={`${option.questionId}-${option.id}`}
              className={`flex items-center gap-2 p-2 rounded border border-border ${isDisabled ? 'cursor-default' : 'hover:bg-accent cursor-pointer'}`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) =>
                  toggleOption(option, checked as boolean)
                }
                disabled={isDisabled}
                style={readOnly ? { opacity: 1 } : undefined}
              />
              <span className="text-sm text-foreground">{option.text}</span>
            </Label>
          );
        })}
      </div>
    </div>
  );
}
