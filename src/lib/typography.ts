import { cn } from '@/lib/utils'

/**
 * Professional typography system
 * Scales: xs, sm, md, lg, xl, 2xl
 * Variants: display, heading, body, ui, caption, code, button, form, nav, special
 */
export const typography = {
  display: {
    xl: cn('font-heading text-6xl font-bold leading-tight tracking-tight text-gray-700 dark:text-gray-100'),
    lg: cn('font-heading text-5xl font-bold leading-tight tracking-tight text-gray-700 dark:text-gray-100'),
    md: cn('font-heading text-4xl font-bold leading-tight tracking-tight text-gray-700 dark:text-gray-100'),
  },
  heading: {
    xl: cn('font-heading text-4xl font-bold leading-snug text-gray-700 dark:text-gray-100'),
    lg: cn('font-heading text-3xl font-semibold leading-snug text-gray-700 dark:text-gray-100'),
    md: cn('font-heading text-2xl font-semibold leading-snug text-gray-700 dark:text-gray-100'),
    sm: cn('font-heading text-xl font-semibold leading-snug text-gray-700 dark:text-gray-100'),
    xs: cn('font-heading text-lg font-semibold leading-snug text-gray-700 dark:text-gray-100'),
  },
  body: {
    lg: cn('font-body text-lg leading-relaxed text-gray-800 dark:text-gray-200'),
    md: cn('font-body text-base leading-relaxed text-gray-800 dark:text-gray-200'),
    sm: cn('font-body text-sm leading-relaxed text-gray-700 dark:text-gray-300'),
    xs: cn('font-body text-xs leading-relaxed text-gray-600 dark:text-gray-400'),
  },
  ui: {
    lg: cn('font-sans text-lg font-medium leading-tight text-gray-700 dark:text-gray-100'),
    md: cn('font-sans text-base font-medium leading-tight text-gray-700 dark:text-gray-100'),
    sm: cn('font-sans text-sm font-medium leading-tight text-gray-800 dark:text-gray-200'),
    xs: cn('font-sans text-xs font-medium leading-tight text-gray-700 dark:text-gray-300'),
  },
  caption: {
    md: cn('font-body text-sm leading-tight text-gray-600 dark:text-gray-400'),
    sm: cn('font-body text-xs leading-tight text-gray-500 dark:text-gray-500'),
  },
  code: {
    md: cn('font-code text-base leading-tight text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'),
    sm: cn('font-code text-sm leading-tight text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded'),
    inline: cn('font-code text-sm text-gray-700 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded'),
  },
  button: {
    lg: cn('font-sans text-lg font-semibold leading-none tracking-wide text-white'),
    md: cn('font-sans text-base font-semibold leading-none tracking-wide text-white'),
    sm: cn('font-sans text-sm font-semibold leading-none tracking-wide text-white'),
    xs: cn('font-sans text-xs font-semibold leading-none tracking-wide text-white'),
  },
  form: {
    label: cn('font-body text-sm font-medium leading-tight text-gray-700 dark:text-gray-100'),
    input: cn('font-body text-base leading-tight text-gray-700 dark:text-gray-100'),
    helper: cn('font-body text-sm leading-tight text-gray-600 dark:text-gray-400'),
    error: cn('font-body text-sm leading-tight text-red-600 dark:text-red-400'),
  },
  nav: {
    lg: cn('font-sans text-lg font-medium leading-none text-gray-700 dark:text-gray-100'),
    md: cn('font-sans text-base font-medium leading-none text-gray-700 dark:text-gray-100'),
    sm: cn('font-sans text-sm font-medium leading-none text-gray-700 dark:text-gray-200'),
  },
  special: {
    gradient: cn('font-heading font-bold bg-gradient-to-r from-gray-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'),
    accent: cn('font-body font-semibold text-blue-600 dark:text-blue-400'),
    success: cn('font-body font-medium text-green-600 dark:text-green-400'),
    warning: cn('font-body font-medium text-yellow-600 dark:text-yellow-400'),
    error: cn('font-body font-medium text-red-600 dark:text-red-400'),
  },
}

/**
 * Type-safe utility to get text classes
 */
export function text<
  V extends keyof typeof typography,
  S extends keyof (typeof typography)[V]
>(
  variant: V,
  size: S,
  additionalClasses?: string
): string {
  return cn(typography[variant][size], additionalClasses)
}

export const {
  display,
  heading,
  body,
  ui,
  caption,
  code,
  button,
  form,
  nav,
  special,
} = typography
