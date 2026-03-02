import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from "lucide-react"

const enhancedToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        success:
          "success group border-success bg-success text-success-foreground",
        warning:
          "warning group border-warning bg-warning text-warning-foreground",
        info:
          "info group border-primary bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface EnhancedToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedToastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  duration?: number
  loading?: boolean
}

const getIcon = (variant: string, loading: boolean) => {
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin" />
  }
  
  switch (variant) {
    case "destructive":
      return <AlertCircle className="h-5 w-5" />
    case "success":
      return <CheckCircle className="h-5 w-5" />
    case "warning":
      return <AlertTriangle className="h-5 w-5" />
    case "info":
      return <Info className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}

const EnhancedToast = React.forwardRef<HTMLDivElement, EnhancedToastProps>(
  ({ 
    className, 
    variant, 
    title, 
    description, 
    action, 
    onClose, 
    loading,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(enhancedToastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon(variant || "default", loading || false)}
          </div>
          
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
            {children}
          </div>
          
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
EnhancedToast.displayName = "EnhancedToast"

// Toast context and provider
interface ToastContextType {
  toasts: EnhancedToastProps[]
  addToast: (toast: Omit<EnhancedToastProps, 'id'>) => void
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<EnhancedToastProps>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<(EnhancedToastProps & { id: string })[]>([])

  const addToast = React.useCallback((toast: Omit<EnhancedToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const updateToast = React.useCallback((id: string, updates: Partial<EnhancedToastProps>) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
    )
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC<{ toasts: (EnhancedToastProps & { id: string })[] }> = ({ toasts }) => {
  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <EnhancedToast
          key={toast.id}
          {...toast}
          onClose={() => toast.onClose?.()}
        />
      ))}
    </div>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Convenience functions
export const toast = {
  success: (title: string, description?: string, options?: Partial<EnhancedToastProps>) => {
    // This would be implemented with the toast context
    console.log("Toast success:", title, description, options)
  },
  error: (title: string, description?: string, options?: Partial<EnhancedToastProps>) => {
    console.log("Toast error:", title, description, options)
  },
  warning: (title: string, description?: string, options?: Partial<EnhancedToastProps>) => {
    console.log("Toast warning:", title, description, options)
  },
  info: (title: string, description?: string, options?: Partial<EnhancedToastProps>) => {
    console.log("Toast info:", title, description, options)
  },
  loading: (title: string, description?: string, options?: Partial<EnhancedToastProps>) => {
    console.log("Toast loading:", title, description, options)
  },
}

export { EnhancedToast, enhancedToastVariants }


