"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextQuestionProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function TextQuestion({
  label,
  value,
  placeholder = "Enter your answer...",
  onChange,
  disabled = false,
  readOnly = false,
}: TextQuestionProps) {
  // console.log('TextQuestion rendered with value:', value); // Debug log
  
  const handleValueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled || readOnly) return;
    onChange(event.target.value);
  };

  const isDisabled = disabled || readOnly;

  return (
    <div className="space-y-4">
      <Label className="block font-medium text-foreground">{label}</Label>
      <Textarea
        value={value}
        onChange={handleValueChange}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly={readOnly}
        className="min-h-20"
        style={readOnly ? { opacity: 1 } : undefined}
      />
    </div>
  );
}
