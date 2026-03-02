import React from 'react'
import { cn } from '@/lib/utils'

export interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  autoFit?: boolean
  minWidth?: string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  autoFit = false,
  minWidth = '300px',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }

  const responsiveClasses = Object.entries(columns)
    .map(([breakpoint, cols]) => {
      if (breakpoint === 'default') {
        return columnClasses[cols as keyof typeof columnClasses] || 'grid-cols-1'
      }
      return `${breakpoint}:${columnClasses[cols as keyof typeof columnClasses] || 'grid-cols-1'}`
    })
    .join(' ')

  if (autoFit) {
    return (
      <div
        className={cn(
          'grid',
          gapClasses[gap],
          className
        )}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid',
        responsiveClasses,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ResponsiveFlexProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: Partial<ResponsiveFlexProps>
    md?: Partial<ResponsiveFlexProps>
    lg?: Partial<ResponsiveFlexProps>
    xl?: Partial<ResponsiveFlexProps>
  }
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className,
  direction = 'row',
  wrap = 'wrap',
  justify = 'start',
  align = 'start',
  gap = 'md',
  responsive,
}) => {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse',
  }

  const wrapClasses = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
  }

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  }

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, props]) => {
          const classes = []
          if (props.direction) {
            classes.push(`${breakpoint}:${directionClasses[props.direction]}`)
          }
          if (props.justify) {
            classes.push(`${breakpoint}:${justifyClasses[props.justify]}`)
          }
          if (props.align) {
            classes.push(`${breakpoint}:${alignClasses[props.align]}`)
          }
          if (props.gap) {
            classes.push(`${breakpoint}:${gapClasses[props.gap]}`)
          }
          return classes.join(' ')
        })
        .join(' ')
    : ''

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        wrapClasses[wrap],
        justifyClasses[justify],
        alignClasses[align],
        gapClasses[gap],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  center?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  center = true,
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8',
  }

  return (
    <div
      className={cn(
        'w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  responsive?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right' | 'justify'
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'destructive'
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  size = 'base',
  responsive,
  weight = 'normal',
  align = 'left',
  color = 'primary',
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  }

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  }

  const colorClasses = {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground',
    accent: 'text-accent-foreground',
    destructive: 'text-destructive',
  }

  const responsiveClasses = responsive
    ? Object.entries(responsive)
        .map(([breakpoint, size]) => `${breakpoint}:${sizeClasses[size as keyof typeof sizeClasses]}`)
        .join(' ')
    : ''

  return (
    <div
      className={cn(
        sizeClasses[size],
        weightClasses[weight],
        alignClasses[align],
        colorClasses[color],
        responsiveClasses,
        className
      )}
    >
      {children}
    </div>
  )
}

export interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  sizes?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'wide'
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  loading?: 'lazy' | 'eager'
  priority?: boolean
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className,
  sizes,
  aspectRatio = 'square',
  objectFit = 'cover',
  loading = 'lazy',
  priority = false,
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    wide: 'aspect-[16/9]',
  }

  const objectFitClasses = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }

  const sizesString = sizes
    ? Object.entries(sizes)
        .map(([breakpoint, size]) => `(min-width: ${breakpoint === 'sm' ? '640px' : breakpoint === 'md' ? '768px' : breakpoint === 'lg' ? '1024px' : '1280px'}) ${size}`)
        .join(', ')
    : '100vw'

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'w-full h-auto',
        aspectRatioClasses[aspectRatio],
        objectFitClasses[objectFit],
        className
      )}
      loading={loading}
      sizes={sizesString}
      {...(priority && { fetchPriority: 'high' })}
    />
  )
}

export default ResponsiveGrid


