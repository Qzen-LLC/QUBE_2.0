'use client';

import { useState, useEffect } from 'react';

export function useStableRender() {
  const [mounted, setMounted] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [cssReady, setCssReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if theme is ready
    const checkTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      
      // Check if theme classes are applied
      const hasTheme = root.classList.contains('dark') || body.classList.contains('dark') || 
                      root.classList.contains('light') || body.classList.contains('light');
      
      // Check if theme ready flag is set
      const themeFlagReady = root.getAttribute('data-theme-ready') === 'true';
      
      if (hasTheme || themeFlagReady) {
        setThemeReady(true);
      } else {
        setTimeout(checkTheme, 50);
      }
    };
    
    // Check if CSS is fully loaded
    const checkCSS = () => {
      // Check if Next.js styles are loaded
      const nextjsStyles = document.querySelector('style[data-nextjs]') !== null;
      
      // Check if Tailwind CSS variables are available
      const cssVarsReady = getComputedStyle(document.documentElement)
        .getPropertyValue('--background') !== '';
      
      // Check if document is fully loaded
      const docReady = document.readyState === 'complete';
      
      if ((nextjsStyles && cssVarsReady) || docReady) {
        // Add a small delay to ensure everything is stable
        setTimeout(() => setCssReady(true), 100);
      } else {
        setTimeout(checkCSS, 100);
      }
    };
    
    // Start checking after a short delay
    setTimeout(() => {
      checkTheme();
      checkCSS();
    }, 50);
  }, []);

  const isReady = mounted && themeReady && cssReady;
  
  return {
    mounted,
    themeReady,
    cssReady,
    isReady
  };
}
