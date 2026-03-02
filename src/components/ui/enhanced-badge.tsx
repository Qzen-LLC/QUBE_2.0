import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const enhancedBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        outline: "text-foreground border-border",
        ghost: "text-foreground hover:bg-muted",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedBadgeVariants> {
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ReactNode
}

function EnhancedBadge({ 
  className, 
  variant, 
  size, 
  dismissible, 
  onDismiss, 
  icon, 
  children, 
  ...props 
}: EnhancedBadgeProps) {
  return (
    <div className={cn(enhancedBadgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="ml-1 h-3 w-3 rounded-full hover:bg-current/20 transition-colors"
          aria-label="Remove badge"
        >
          <X className="h-2 w-2" />
        </button>
      )}
    </div>
  )
}

export { EnhancedBadge, enhancedBadgeVariants }

