import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedTooltipProvider = TooltipPrimitive.Provider

const enhancedTooltip = TooltipPrimitive.Root

const enhancedTooltipTrigger = TooltipPrimitive.Trigger

const enhancedTooltipContentVariants = cva(
  "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground border-border",
        dark: "bg-gray-900 text-white border-gray-700",
        light: "bg-white text-gray-900 border-gray-200",
        success: "bg-success text-success-foreground border-success",
        warning: "bg-warning text-warning-foreground border-warning",
        destructive: "bg-destructive text-destructive-foreground border-destructive",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-1.5 text-sm",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedTooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof enhancedTooltipContentVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
}

const EnhancedTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  EnhancedTooltipContentProps
>(({ className, variant, size, title, description, icon, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(enhancedTooltipContentVariants({ variant, size }), className)}
    {...props}
  >
    <div className="flex items-center space-x-2">
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <div className="space-y-1">
        {title && (
          <div className="font-medium">{title}</div>
        )}
        {description && (
          <div className="text-xs opacity-90">{description}</div>
        )}
        {!title && !description && props.children}
      </div>
    </div>
    <TooltipPrimitive.Arrow className="fill-current" />
  </TooltipPrimitive.Content>
))
EnhancedTooltipContent.displayName = TooltipPrimitive.Content.displayName

// Convenience wrapper component
export interface EnhancedTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode
  variant?: "default" | "dark" | "light" | "success" | "warning" | "destructive"
  size?: "sm" | "default" | "lg"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  skipDelayDuration?: number
  disabled?: boolean
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  title,
  description,
  icon,
  variant = "default",
  size = "default",
  side = "top",
  align = "center",
  delayDuration = 0,
  skipDelayDuration = 0,
  disabled = false,
}) => {
  if (disabled) {
    return <>{children}</>
  }

  return (
    <enhancedTooltipProvider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <enhancedTooltip>
        <enhancedTooltipTrigger asChild>
          {children}
        </enhancedTooltipTrigger>
        <EnhancedTooltipContent
          variant={variant}
          size={size}
          side={side}
          align={align}
          title={title}
          description={description}
          icon={icon}
        >
          {content}
        </EnhancedTooltipContent>
      </enhancedTooltip>
    </enhancedTooltipProvider>
  )
}

// Specialized tooltip components
export const InfoTooltip: React.FC<{
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
}> = ({ children, content, title, description }) => (
  <EnhancedTooltip
    content={content}
    title={title}
    description={description}
    variant="default"
    icon={<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
  >
    {children}
  </EnhancedTooltip>
)

export const WarningTooltip: React.FC<{
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
}> = ({ children, content, title, description }) => (
  <EnhancedTooltip
    content={content}
    title={title}
    description={description}
    variant="warning"
    icon={<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
  >
    {children}
  </EnhancedTooltip>
)

export const ErrorTooltip: React.FC<{
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
}> = ({ children, content, title, description }) => (
  <EnhancedTooltip
    content={content}
    title={title}
    description={description}
    variant="destructive"
    icon={<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
  >
    {children}
  </EnhancedTooltip>
)

export const SuccessTooltip: React.FC<{
  children: React.ReactNode
  content: React.ReactNode
  title?: string
  description?: string
}> = ({ children, content, title, description }) => (
  <EnhancedTooltip
    content={content}
    title={title}
    description={description}
    variant="success"
    icon={<svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
  >
    {children}
  </EnhancedTooltip>
)

export {
  enhancedTooltipProvider,
  enhancedTooltip,
  enhancedTooltipTrigger,
  EnhancedTooltipContent,
  enhancedTooltipContentVariants,
}


