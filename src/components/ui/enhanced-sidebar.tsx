import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X
} from "lucide-react"
import { EnhancedButton } from "./enhanced-button"

const enhancedSidebarVariants = cva(
  "flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        elevated: "bg-card border-border shadow-lg",
        minimal: "bg-transparent border-transparent",
      },
      size: {
        sm: "w-64",
        default: "w-72",
        lg: "w-80",
        collapsed: "w-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const sidebarItemVariants = cva(
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "text-foreground hover:text-foreground",
        active: "bg-primary text-primary-foreground hover:bg-primary/90",
        disabled: "text-muted-foreground cursor-not-allowed hover:bg-transparent",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: string | number
  children?: SidebarItem[]
  disabled?: boolean
}

export interface EnhancedSidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedSidebarVariants> {
  items: SidebarItem[]
  activeItem?: string
  onItemClick?: (item: SidebarItem) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  showToggle?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onUserAction?: (action: string) => void
}

const SidebarItemComponent: React.FC<{
  item: SidebarItem
  activeItem?: string
  collapsed?: boolean
  onItemClick?: (item: SidebarItem) => void
  level?: number
}> = ({ item, activeItem, collapsed, onItemClick, level = 0 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isActive = activeItem === item.id
  const hasChildren = item.children && item.children.length > 0

  const handleClick = () => {
    if (item.disabled) return
    
    if (hasChildren && !collapsed) {
      setIsExpanded(!isExpanded)
    } else {
      onItemClick?.(item)
    }
  }

  const paddingLeft = level > 0 ? `pl-${6 + level * 4}` : "pl-3"

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={item.disabled}
        className={cn(
          sidebarItemVariants({
            variant: isActive ? "active" : item.disabled ? "disabled" : "default",
            size: "default",
          }),
          paddingLeft,
          collapsed && "justify-center px-2"
        )}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {item.icon && (
          <span className={cn("flex-shrink-0", collapsed && "mx-auto")}>
            {item.icon}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span className="ml-auto">
                {isExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
          </>
        )}
      </button>
      
      {hasChildren && isExpanded && !collapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              activeItem={activeItem}
              collapsed={collapsed}
              onItemClick={onItemClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const EnhancedSidebar = React.forwardRef<HTMLDivElement, EnhancedSidebarProps>(
  ({ 
    className, 
    variant, 
    size, 
    items, 
    activeItem, 
    onItemClick, 
    collapsed = false,
    onToggleCollapse,
    showToggle = true,
    header,
    footer,
    user,
    onUserAction,
    ...props 
  }, ref) => {
    const currentSize = collapsed ? "collapsed" : size

    return (
      <div
        ref={ref}
        className={cn(enhancedSidebarVariants({ variant, size: currentSize }), className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          {!collapsed && header && (
            <div className="flex-1">{header}</div>
          )}
          {showToggle && onToggleCollapse && (
            <EnhancedButton
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </EnhancedButton>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
          {items.map((item) => (
            <SidebarItemComponent
              key={item.id}
              item={item}
              activeItem={activeItem}
              collapsed={collapsed}
              onItemClick={onItemClick}
            />
          ))}
        </nav>

        {/* User Section */}
        {user && (
          <div className="border-t p-4">
            {collapsed ? (
              <div className="flex justify-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <EnhancedButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onUserAction?.("logout")}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </EnhancedButton>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {footer && !collapsed && (
          <div className="border-t p-4">
            {footer}
          </div>
        )}
      </div>
    )
  }
)
EnhancedSidebar.displayName = "EnhancedSidebar"

// Mobile sidebar variant
export interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  items: SidebarItem[]
  activeItem?: string
  onItemClick?: (item: SidebarItem) => void
  header?: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onUserAction?: (action: string) => void
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  items,
  activeItem,
  onItemClick,
  header,
  user,
  onUserAction,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            {header && <div className="flex-1">{header}</div>}
            <EnhancedButton
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </EnhancedButton>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
            {items.map((item) => (
              <SidebarItemComponent
                key={item.id}
                item={item}
                activeItem={activeItem}
                collapsed={false}
                onItemClick={(clickedItem) => {
                  onItemClick?.(clickedItem)
                  onClose()
                }}
              />
            ))}
          </nav>

          {/* User Section */}
          {user && (
            <div className="border-t p-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <EnhancedButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onUserAction?.("logout")}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </EnhancedButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export { EnhancedSidebar, MobileSidebar, sidebarItemVariants }


