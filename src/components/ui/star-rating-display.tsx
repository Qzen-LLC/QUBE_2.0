'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingDisplayProps {
  value: number; // 0 to 5, in increments of 0.5
  size?: number;
}

export function StarRatingDisplay({ value, size = 16 }: StarRatingDisplayProps) {
  if (value <= 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = value >= star;
        const isHalfFilled = value >= star - 0.5 && value < star;

        return (
          <div key={star} className="relative" style={{ width: size, height: size }}>
            {/* Background star (unfilled) */}
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
      <span className="ml-2 text-sm text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}
