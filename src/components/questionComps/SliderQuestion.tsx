"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SliderQuestionProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function SliderQuestion({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  readOnly = false,
}: SliderQuestionProps) {
  // console.log('SliderQuestion rendered with value:', value); // Debug log
  
  const handleValueChange = (newValue: number[]) => {
    if (disabled || readOnly) return;
    // Slider returns an array, we take the first value
    const singleValue = newValue[0] || min;
    onChange(singleValue);
  };

  const isDisabled = disabled || readOnly;

  return (
    <div className="space-y-4">
      <Label className="block font-medium text-foreground">{label}</Label>
      <div className="px-4">
        <Slider
          value={[value]}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          disabled={isDisabled}
          className="w-full"
          style={readOnly ? { opacity: 1 } : undefined}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>{min}</span>
          <span className="font-medium text-foreground">{value}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
