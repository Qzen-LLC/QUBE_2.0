import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { EnhancedButton } from "./enhanced-button"

const enhancedModalOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
)

const enhancedModalContentVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      variant: {
        default: "border-border",
        success: "border-success",
        warning: "border-warning",
        destructive: "border-destructive",
        info: "border-primary",
      },
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] h-[95vh]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedModalProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  children: React.ReactNode
}

export interface EnhancedModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof enhancedModalContentVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
  showCloseButton?: boolean
  onClose?: () => void
}

export interface EnhancedModalHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export interface EnhancedModalFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary"
    loading?: boolean
    disabled?: boolean
  }>
  align?: "left" | "center" | "right"
}

const EnhancedModal = DialogPrimitive.Root

const EnhancedModalTrigger = DialogPrimitive.Trigger

const EnhancedModalPortal = DialogPrimitive.Portal

const EnhancedModalClose = DialogPrimitive.Close

const EnhancedModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(enhancedModalOverlayVariants(), className)}
    {...props}
  />
))
EnhancedModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const EnhancedModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  EnhancedModalContentProps
>(({ 
  className, 
  variant, 
  size, 
  title, 
  description, 
  icon, 
  showCloseButton = true,
  onClose,
  children, 
  ...props 
}, ref) => {
  const getIcon = () => {
    if (icon) return icon
    
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-6 w-6 text-destructive" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-success" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-warning" />
      case "info":
        return <Info className="h-6 w-6 text-primary" />
      default:
        return null
    }
  }

  return (
    <EnhancedModalPortal>
      <EnhancedModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(enhancedModalContentVariants({ variant, size }), className)}
        {...props}
      >
        {(title || description || icon) && (
          <div className="flex items-start gap-4">
            {getIcon() && (
              <div className="flex-shrink-0 mt-1">
                {getIcon()}
              </div>
            )}
            <div className="flex-1 space-y-2">
              {title && (
                <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {showCloseButton && (
              <DialogPrimitive.Close
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>
        )}
        
        {children}
      </DialogPrimitive.Content>
    </EnhancedModalPortal>
  )
})
EnhancedModalContent.displayName = DialogPrimitive.Content.displayName

const EnhancedModalHeader = React.forwardRef<
  HTMLDivElement,
  EnhancedModalHeaderProps
>(({ className, title, description, icon, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  >
    {icon && (
      <div className="flex justify-center sm:justify-start mb-2">
        {icon}
      </div>
    )}
    {title && (
      <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
        {title}
      </DialogPrimitive.Title>
    )}
    {description && (
      <DialogPrimitive.Description className="text-sm text-muted-foreground">
        {description}
      </DialogPrimitive.Description>
    )}
  </div>
))
EnhancedModalHeader.displayName = "EnhancedModalHeader"

const EnhancedModalFooter = React.forwardRef<
  HTMLDivElement,
  EnhancedModalFooterProps
>(({ className, actions = [], align = "right", ...props }, ref) => {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row gap-2",
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {actions.map((action, index) => (
        <EnhancedButton
          key={index}
          variant={action.variant || "default"}
          onClick={action.onClick}
          loading={action.loading}
          disabled={action.disabled}
        >
          {action.label}
        </EnhancedButton>
      ))}
    </div>
  )
})
EnhancedModalFooter.displayName = "EnhancedModalFooter"

const EnhancedModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
EnhancedModalTitle.displayName = DialogPrimitive.Title.displayName

const EnhancedModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedModalDescription.displayName = DialogPrimitive.Description.displayName

// Convenience components for common modal types
export const ConfirmationModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning"
  loading?: boolean
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}) => (
  <EnhancedModal open={isOpen} onOpenChange={onClose}>
    <EnhancedModalContent variant={variant} title={title} description={description}>
      <EnhancedModalFooter
        actions={[
          {
            label: cancelText,
            onClick: onClose,
            variant: "outline",
            disabled: loading,
          },
          {
            label: confirmText,
            onClick: onConfirm,
            variant: variant === "destructive" ? "destructive" : "default",
            loading,
          },
        ]}
      />
    </EnhancedModalContent>
  </EnhancedModal>
)

export const InfoModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  buttonText?: string
}> = ({
  isOpen,
  onClose,
  title,
  description,
  buttonText = "Got it",
}) => (
  <EnhancedModal open={isOpen} onOpenChange={onClose}>
    <EnhancedModalContent variant="info" title={title} description={description}>
      <EnhancedModalFooter
        actions={[
          {
            label: buttonText,
            onClick: onClose,
          },
        ]}
      />
    </EnhancedModalContent>
  </EnhancedModal>
)

export {
  EnhancedModal,
  EnhancedModalPortal,
  EnhancedModalOverlay,
  EnhancedModalTrigger,
  EnhancedModalClose,
  EnhancedModalContent,
  EnhancedModalHeader,
  EnhancedModalFooter,
  EnhancedModalTitle,
  EnhancedModalDescription,
}


