import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring/50 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md hover:shadow-lg hover:from-primary-700 hover:to-primary-800 active:scale-95 dark:from-primary-500 dark:to-primary-600 dark:hover:from-primary-600 dark:hover:to-primary-700",
        destructive:
          "bg-gradient-to-r from-danger-600 to-danger-700 text-white shadow-md hover:shadow-lg hover:from-danger-700 hover:to-danger-800 active:scale-95 dark:from-danger-500 dark:to-danger-600 dark:hover:from-danger-600 dark:hover:to-danger-700",
        outline:
          "border border-border bg-background text-foreground shadow-sm hover:bg-muted hover:text-foreground hover:shadow-md active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md active:scale-95 dark:bg-gray-700 dark:hover:bg-gray-600",
        ghost:
          "hover:bg-muted hover:text-foreground active:scale-95 dark:hover:bg-gray-700",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",
        success:
          "bg-gradient-to-r from-success-600 to-success-700 text-white shadow-md hover:shadow-lg hover:from-success-700 hover:to-success-800 active:scale-95 dark:from-success-500 dark:to-success-600 dark:hover:from-success-600 dark:hover:to-success-700",
        warning:
          "bg-gradient-to-r from-warning-600 to-warning-700 text-white shadow-md hover:shadow-lg hover:from-warning-700 hover:to-warning-800 active:scale-95 dark:from-warning-500 dark:to-warning-600 dark:hover:from-warning-600 dark:hover:to-warning-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(enhancedButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {loading ? loadingText || "Loading..." : children}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }

