"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextMiniQuestionProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function TextMiniQuestion({
  label,
  value,
  placeholder = "Enter your answer...",
  onChange,
  disabled = false,
  readOnly = false,
}: TextMiniQuestionProps) {
  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    onChange(event.target.value);
  };

  const isDisabled = disabled || readOnly;

  return (
    <div className="space-y-2">
      <Label className="block font-medium text-foreground">{label}</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={value}
            onChange={handleValueChange}
            placeholder={placeholder}
            disabled={isDisabled}
            readOnly={readOnly}
            className="h-9"
            style={readOnly ? { opacity: 1 } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
