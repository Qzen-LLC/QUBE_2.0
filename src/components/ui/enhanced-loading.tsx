import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const enhancedLoadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-primary",
        muted: "text-muted-foreground",
        white: "text-white",
        success: "text-success",
        warning: "text-warning",
        destructive: "text-destructive",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      type: {
        spinner: "",
        dots: "",
        pulse: "",
        bars: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      type: "spinner",
    },
  }
)

export interface EnhancedLoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedLoadingVariants> {
  text?: string
  fullScreen?: boolean
  overlay?: boolean
}

const EnhancedLoading = React.forwardRef<HTMLDivElement, EnhancedLoadingProps>(
  ({ className, variant, size, type, text, fullScreen, overlay, ...props }, ref) => {
    const renderSpinner = () => {
      switch (type) {
        case "dots":
          return (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full bg-current animate-pulse",
                    size === "sm" && "h-1 w-1",
                    size === "default" && "h-2 w-2",
                    size === "lg" && "h-3 w-3",
                    size === "xl" && "h-4 w-4"
                  )}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          )
        case "pulse":
          return (
            <div
              className={cn(
                "rounded-full bg-current animate-pulse",
                size === "sm" && "h-4 w-4",
                size === "default" && "h-6 w-6",
                size === "lg" && "h-8 w-8",
                size === "xl" && "h-12 w-12"
              )}
            />
          )
        case "bars":
          return (
            <div className="flex space-x-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-current animate-pulse",
                    size === "sm" && "h-3 w-1",
                    size === "default" && "h-4 w-1",
                    size === "lg" && "h-6 w-1",
                    size === "xl" && "h-8 w-1"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.8s",
                  }}
                />
              ))}
            </div>
          )
        default:
          return <div className={cn("rounded-full border-2 border-current border-t-transparent", size === "sm" && "h-4 w-4", size === "default" && "h-6 w-6", size === "lg" && "h-8 w-8", size === "xl" && "h-12 w-12")} />
      }
    }

    const content = (
      <div
        ref={ref}
        className={cn(
          enhancedLoadingVariants({ variant, size, type }),
          className
        )}
        {...props}
      >
        {renderSpinner()}
        {text && (
          <span className={cn("ml-2 text-sm", variant === "white" && "text-white")}>
            {text}
          </span>
        )}
      </div>
    )

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      )
    }

    if (overlay) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      )
    }

    return content
  }
)
EnhancedLoading.displayName = "EnhancedLoading"

// Specific loading components for common use cases
export const PageLoading = ({ text = "Loading..." }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <EnhancedLoading size="lg" text={text} />
  </div>
)

export const CardLoading = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center p-8">
    <EnhancedLoading text={text} />
  </div>
)

export const ButtonLoading = ({ text = "Loading..." }: { text?: string }) => (
  <EnhancedLoading size="sm" text={text} />
)

export const InlineLoading = ({ text }: { text?: string }) => (
  <EnhancedLoading size="sm" variant="muted" text={text} />
)

export { EnhancedLoading, enhancedLoadingVariants }

