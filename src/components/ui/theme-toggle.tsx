'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, isDark, mounted } = useTheme();

  // Return a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className="h-7 w-7 p-0"
        disabled
      >
        <div className="h-3.5 w-3.5" />
      </Button>
    );
  }

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
      className="h-7 w-7 hover:bg-muted p-0"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </Button>
  );
}


