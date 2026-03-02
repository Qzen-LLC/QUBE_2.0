'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface EnhancedThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}

const EnhancedThemeContext = createContext<EnhancedThemeContextType | undefined>(undefined)

export const useEnhancedTheme = () => {
  const context = useContext(EnhancedThemeContext)
  if (!context) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider')
  }
  return context
}

interface EnhancedThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  enableSystem?: boolean
}

export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'enhanced-theme',
  enableSystem = true,
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Get resolved theme (actual theme being used)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Update system theme
  useEffect(() => {
    if (!enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)

    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [enableSystem])

  // Load theme from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored)
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
    setMounted(true)
  }, [storageKey])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const body = document.body

    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    body.classList.remove('light', 'dark')

    // Add new theme class
    root.classList.add(resolvedTheme)
    body.classList.add(resolvedTheme)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#0f0f0f' : '#ffffff'
      )
    }

    // Update CSS custom properties for better theme transitions
    root.style.setProperty('--theme-transition', 'all 0.2s ease-in-out')
  }, [resolvedTheme, mounted])

  // Save theme to localStorage
  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <EnhancedThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        systemTheme,
      }}
    >
      {children}
    </EnhancedThemeContext.Provider>
  )
}

// Theme toggle hook for easy theme switching
export const useThemeToggle = () => {
  const { theme, setTheme } = useEnhancedTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    cycleTheme,
  }
}

// Theme-aware color utilities
export const useThemeColors = () => {
  const { resolvedTheme } = useEnhancedTheme()

  const colors = {
    light: {
      background: 'hsl(210 20% 96%)', /* slate-100 */
      foreground: 'hsl(0 0% 0%)',
      primary: 'hsl(221.2 83.2% 53.3%)',
      secondary: 'hsl(210 40% 98%)',
      muted: 'hsl(214 32% 91%)', /* slate-200 */
      accent: 'hsl(214 32% 91%)', /* slate-200 */
      destructive: 'hsl(0 84.2% 60.2%)',
      border: 'hsl(214 32% 84%)', /* slate-300 */
      input: 'hsl(214 32% 84%)', /* slate-300 */
      ring: 'hsl(221.2 83.2% 53.3%)',
    },
    dark: {
      background: 'hsl(0 0% 7%)',
      foreground: 'hsl(0 0% 100%)',
      primary: 'hsl(217.2 91.2% 59.8%)',
      secondary: 'hsl(0 0% 16%)',
      muted: 'hsl(0 0% 16%)',
      accent: 'hsl(0 0% 16%)',
      destructive: 'hsl(0 62.8% 30.6%)',
      border: 'hsl(0 0% 16%)',
      input: 'hsl(0 0% 16%)',
      ring: 'hsl(217.2 91.2% 59.8%)',
    },
  }

  return colors[resolvedTheme]
}

// Theme-aware component wrapper
export const withTheme = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { resolvedTheme } = useEnhancedTheme()
    
    return (
      <div data-theme={resolvedTheme}>
        <Component {...props} ref={ref} />
      </div>
    )
  })
}

export default EnhancedThemeProvider
