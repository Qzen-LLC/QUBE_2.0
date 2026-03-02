'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number; // 0 to 5, in increments of 0.5
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: number;
}

export function StarRating({ value, onChange, disabled = false, size = 24 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const newValue = starIndex + (isHalf ? 0.5 : 1);
    onChange(newValue);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    if (disabled) return;
    const hoveredValue = starIndex + (isHalf ? 0.5 : 1);
    setHoverValue(hoveredValue);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const starValue = starIndex + 1;
        const isFilled = displayValue >= starValue;
        const isHalfFilled = displayValue >= starIndex + 0.5 && displayValue < starValue;

        return (
          <div
            key={starIndex}
            className="relative cursor-pointer"
            style={{ width: size, height: size }}
            onClick={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const isHalf = clickX < rect.width / 2;
              handleStarClick(starIndex, isHalf);
            }}
            onMouseMove={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const isHalf = mouseX < rect.width / 2;
              handleStarHover(starIndex, isHalf);
            }}
          >
            {/* Background star (always visible, unfilled) */}
            <Star
              className="absolute inset-0 text-gray-300 dark:text-gray-700"
              size={size}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
            />
            {/* Half-filled star overlay */}
            {isHalfFilled && !isFilled && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star
                  className="text-yellow-400 dark:text-yellow-500"
                  size={size}
                  fill="currentColor"
                />
              </div>
            )}
            {/* Fully filled star */}
            {isFilled && (
              <Star
                className="absolute inset-0 text-yellow-400 dark:text-yellow-500"
                size={size}
                fill="currentColor"
              />
            )}
          </div>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
