'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;
  const isDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark());
  
  // Apply to both document element and body
  root.classList.toggle('dark', isDark);
  body.classList.toggle('dark', isDark);
  
  // Set theme ready flag
  root.setAttribute('data-theme-ready', 'true');
  
  console.log('Theme applied:', { theme, isDark, rootClasses: root.className, bodyClasses: body.className });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && (localStorage.getItem('theme') as ThemeMode)) || 'system';
    setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyThemeClass(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') applyThemeClass('system');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);

  const isDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark());

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

