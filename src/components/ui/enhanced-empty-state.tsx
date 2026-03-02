import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { 
  FileX, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Plus,
  RefreshCw
} from "lucide-react"
import { EnhancedButton } from "./enhanced-button"

const enhancedEmptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        error: "text-destructive",
        success: "text-success",
        warning: "text-warning",
        info: "text-primary",
      },
      size: {
        sm: "py-8",
        default: "py-12",
        lg: "py-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedEmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedEmptyStateVariants> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  illustration?: React.ReactNode
}

const getDefaultIcon = (variant: string) => {
  switch (variant) {
    case "error":
      return <AlertCircle className="h-12 w-12" />
    case "success":
      return <CheckCircle className="h-12 w-12" />
    case "warning":
      return <AlertTriangle className="h-12 w-12" />
    case "info":
      return <Info className="h-12 w-12" />
    default:
      return <FileX className="h-12 w-12" />
  }
}

const EnhancedEmptyState = React.forwardRef<HTMLDivElement, EnhancedEmptyStateProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon, 
    title, 
    description, 
    action, 
    secondaryAction, 
    illustration,
    ...props 
  }, ref) => {
    const displayIcon = icon || getDefaultIcon(variant || "default")

    return (
      <div
        ref={ref}
        className={cn(enhancedEmptyStateVariants({ variant, size }), className)}
        {...props}
      >
        <div className="flex flex-col items-center space-y-4 max-w-md">
          {/* Icon or Illustration */}
          <div className="flex-shrink-0">
            {illustration || (
              <div className={cn(
                "rounded-full p-4",
                variant === "error" && "bg-destructive/10",
                variant === "success" && "bg-success/10",
                variant === "warning" && "bg-warning/10",
                variant === "info" && "bg-primary/10",
                variant === "default" && "bg-muted"
              )}>
                {displayIcon}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className={cn(
              "text-lg font-semibold",
              variant === "error" && "text-destructive",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
              variant === "info" && "text-primary",
              variant === "default" && "text-foreground"
            )}>
              {title}
            </h3>
            
            {description && (
              <p className="text-sm text-muted-foreground max-w-sm">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {action && (
                <EnhancedButton
                  onClick={action.onClick}
                  variant={action.variant || "default"}
                  size="sm"
                >
                  {action.label}
                </EnhancedButton>
              )}
              {secondaryAction && (
                <EnhancedButton
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || "outline"}
                  size="sm"
                >
                  {secondaryAction.label}
                </EnhancedButton>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)
EnhancedEmptyState.displayName = "EnhancedEmptyState"

// Predefined empty states for common scenarios
export const NoDataEmptyState = ({ 
  title = "No data available",
  description = "There's no data to display at the moment.",
  onRefresh,
  onCreate,
}: {
  title?: string
  description?: string
  onRefresh?: () => void
  onCreate?: () => void
}) => (
  <EnhancedEmptyState
    icon={<FileX className="h-12 w-12" />}
    title={title}
    description={description}
    action={onCreate ? { label: "Create New", onClick: onCreate } : undefined}
    secondaryAction={onRefresh ? { label: "Refresh", onClick: onRefresh } : undefined}
  />
)

export const NoResultsEmptyState = ({ 
  title = "No results found",
  description = "Try adjusting your search criteria or filters.",
  onClearFilters,
  onNewSearch,
}: {
  title?: string
  description?: string
  onClearFilters?: () => void
  onNewSearch?: () => void
}) => (
  <EnhancedEmptyState
    icon={<Search className="h-12 w-12" />}
    title={title}
    description={description}
    action={onNewSearch ? { label: "New Search", onClick: onNewSearch } : undefined}
    secondaryAction={onClearFilters ? { label: "Clear Filters", onClick: onClearFilters } : undefined}
  />
)

export const ErrorEmptyState = ({ 
  title = "Something went wrong",
  description = "We encountered an error while loading your data.",
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) => (
  <EnhancedEmptyState
    variant="error"
    icon={<AlertCircle className="h-12 w-12" />}
    title={title}
    description={description}
    action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
  />
)

export const SuccessEmptyState = ({ 
  title = "All caught up!",
  description = "You're all set with no pending items.",
}: {
  title?: string
  description?: string
}) => (
  <EnhancedEmptyState
    variant="success"
    icon={<CheckCircle className="h-12 w-12" />}
    title={title}
    description={description}
  />
)

export { EnhancedEmptyState, enhancedEmptyStateVariants }



