import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedProgressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        success: "bg-success/20",
        warning: "bg-warning/20",
        destructive: "bg-destructive/20",
        primary: "bg-primary/20",
      },
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const enhancedProgressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        primary: "bg-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface EnhancedProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedProgressVariants> {
  value?: number
  max?: number
  showValue?: boolean
  showPercentage?: boolean
  label?: string
  description?: string
  animated?: boolean
  striped?: boolean
}

const EnhancedProgress = React.forwardRef<HTMLDivElement, EnhancedProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    value = 0, 
    max = 100, 
    showValue = false, 
    showPercentage = false, 
    label, 
    description, 
    animated = false,
    striped = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div className="w-full space-y-2">
        {(label || showValue || showPercentage) && (
          <div className="flex items-center justify-between text-sm">
            {label && (
              <span className="font-medium text-foreground">{label}</span>
            )}
            <div className="flex items-center gap-2">
              {showValue && (
                <span className="text-muted-foreground">
                  {value}/{max}
                </span>
              )}
              {showPercentage && (
                <span className="text-muted-foreground">
                  {Math.round(percentage)}%
                </span>
              )}
            </div>
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(enhancedProgressVariants({ variant, size }), className)}
          {...props}
        >
          <div
            className={cn(
              enhancedProgressIndicatorVariants({ variant }),
              animated && "animate-pulse",
              striped && "bg-stripes"
            )}
            style={{ 
              transform: `translateX(-${100 - percentage}%)`,
              transition: animated ? "transform 0.3s ease-in-out" : "none"
            }}
          />
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    )
  }
)
EnhancedProgress.displayName = "EnhancedProgress"

// Circular progress variant
export interface CircularProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: "default" | "success" | "warning" | "destructive" | "primary"
  showValue?: boolean
  showPercentage?: boolean
  label?: string
  animated?: boolean
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    className, 
    value = 0, 
    max = 100, 
    size = 120, 
    strokeWidth = 8, 
    variant = "default",
    showValue = false, 
    showPercentage = false, 
    label, 
    animated = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    const getVariantColor = () => {
      switch (variant) {
        case "success":
          return "stroke-success"
        case "warning":
          return "stroke-warning"
        case "destructive":
          return "stroke-destructive"
        case "primary":
          return "stroke-primary"
        default:
          return "stroke-primary"
      }
    }

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative" ref={ref} {...props}>
          <svg
            width={size}
            height={size}
            className={cn("transform -rotate-90", className)}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-muted-foreground/20"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className={cn(
                getVariantColor(),
                animated && "transition-all duration-300 ease-in-out"
              )}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {showValue && (
                <div className="text-lg font-semibold text-foreground">
                  {value}
                </div>
              )}
              {showPercentage && (
                <div className="text-sm text-muted-foreground">
                  {Math.round(percentage)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
      </div>
    )
  }
)
CircularProgress.displayName = "CircularProgress"

// Step progress variant
export interface StepProgressProps {
  steps: Array<{
    id: string
    title: string
    description?: string
    status: "completed" | "current" | "upcoming"
  }>
  orientation?: "horizontal" | "vertical"
}

const StepProgress: React.FC<StepProgressProps> = ({ 
  steps, 
  orientation = "horizontal" 
}) => {
  if (orientation === "vertical") {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  step.status === "completed" && "border-success bg-success text-success-foreground",
                  step.status === "current" && "border-primary bg-primary text-primary-foreground",
                  step.status === "upcoming" && "border-muted-foreground text-muted-foreground"
                )}
              >
                {step.status === "completed" ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "text-sm font-medium",
                step.status === "completed" && "text-success",
                step.status === "current" && "text-primary",
                step.status === "upcoming" && "text-muted-foreground"
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                step.status === "completed" && "border-success bg-success text-success-foreground",
                step.status === "current" && "border-primary bg-primary text-primary-foreground",
                step.status === "upcoming" && "border-muted-foreground text-muted-foreground"
              )}
            >
              {step.status === "completed" ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={cn(
                "text-sm font-medium",
                step.status === "completed" && "text-success",
                step.status === "current" && "text-primary",
                step.status === "upcoming" && "text-muted-foreground"
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { EnhancedProgress, CircularProgress, StepProgress, enhancedProgressVariants }


