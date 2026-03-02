import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

const enhancedInputVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:border-primary",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:border-warning focus-visible:ring-warning",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof enhancedInputVariants> {
  label?: string
  helperText?: string
  error?: string
  success?: string
  warning?: string
  showPasswordToggle?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    variant, 
    size, 
    type, 
    label, 
    helperText, 
    error, 
    success, 
    warning, 
    showPasswordToggle, 
    leftIcon, 
    rightIcon, 
    isLoading,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : type

    const currentVariant = error ? "error" : success ? "success" : warning ? "warning" : variant

    const getStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-destructive" />
      if (success) return <CheckCircle className="h-4 w-4 text-success" />
      if (warning) return <AlertCircle className="h-4 w-4 text-warning" />
      return null
    }

    const getStatusMessage = () => {
      if (error) return error
      if (success) return success
      if (warning) return warning
      return helperText
    }

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              enhancedInputVariants({ variant: currentVariant, size }),
              leftIcon && "pl-10",
              (rightIcon || showPasswordToggle || getStatusIcon()) && "pr-10",
              className
            )}
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle || getStatusIcon()) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {showPasswordToggle && type === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
              {!showPasswordToggle && rightIcon}
              {getStatusIcon()}
            </div>
          )}
          
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {getStatusMessage() && (
          <p className={cn(
            "text-xs",
            error && "text-destructive",
            success && "text-success",
            warning && "text-warning",
            !error && !success && !warning && "text-muted-foreground"
          )}>
            {getStatusMessage()}
          </p>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput, enhancedInputVariants }

