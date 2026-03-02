import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

const enhancedBreadcrumbVariants = cva(
  "flex items-center space-x-1 text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        minimal: "text-xs",
        large: "text-base",
      },
      separator: {
        default: "",
        dots: "",
        arrows: "",
      },
    },
    defaultVariants: {
      variant: "default",
      separator: "default",
    },
  }
)

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

export interface EnhancedBreadcrumbProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof enhancedBreadcrumbVariants> {
  items: BreadcrumbItem[]
  showHome?: boolean
  homeHref?: string
  maxItems?: number
  separator?: React.ReactNode
}

const EnhancedBreadcrumb = React.forwardRef<HTMLElement, EnhancedBreadcrumbProps>(
  ({ 
    className, 
    variant, 
    separator, 
    items, 
    showHome = true, 
    homeHref = "/",
    maxItems,
    ...props 
  }, ref) => {
    const getSeparator = () => {
      if (separator) return separator

      switch (separator) {
        case "dots":
          return <span className="text-muted-foreground">•</span>
        case "arrows":
          return <ChevronRight className="h-4 w-4 text-muted-foreground" />
        default:
          return <ChevronRight className="h-4 w-4 text-muted-foreground" />
      }
    }

    // Limit items if maxItems is specified
    const displayItems = React.useMemo(() => {
      if (!maxItems || items.length <= maxItems) return items

      const firstItem = items[0]
      const lastItems = items.slice(-(maxItems - 1))
      
      return [
        firstItem,
        { label: "...", href: undefined, current: false },
        ...lastItems,
      ]
    }, [items, maxItems])

    const allItems = showHome 
      ? [{ label: "Home", href: homeHref, icon: <Home className="h-4 w-4" /> }, ...displayItems]
      : displayItems

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn(enhancedBreadcrumbVariants({ variant, separator }), className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1
            const isCurrent = item.current || isLast

            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-1" aria-hidden="true">
                    {getSeparator()}
                  </span>
                )}
                
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isCurrent && "text-foreground font-medium"
                    )}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }
)
EnhancedBreadcrumb.displayName = "EnhancedBreadcrumb"

// Convenience function to create breadcrumb items from path
export const createBreadcrumbFromPath = (
  pathname: string,
  customLabels?: Record<string, string>
): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean)
  
  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = customLabels?.[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    return {
      label,
      href: index === segments.length - 1 ? undefined : href,
      current: index === segments.length - 1,
    }
  })
}

// Breadcrumb with automatic path generation
export interface AutoBreadcrumbProps
  extends Omit<EnhancedBreadcrumbProps, 'items'> {
  pathname: string
  customLabels?: Record<string, string>
  rootLabel?: string
}

const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  pathname,
  customLabels,
  rootLabel = "Dashboard",
  showHome = false,
  ...props
}) => {
  const items = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0) return []
    
    return [
      { label: rootLabel, href: "/" },
      ...segments.map((segment, index) => {
        const href = '/' + segments.slice(0, index + 1).join('/')
        const label = customLabels?.[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
        
        return {
          label,
          href: index === segments.length - 1 ? undefined : href,
          current: index === segments.length - 1,
        }
      }),
    ]
  }, [pathname, customLabels, rootLabel])

  return (
    <EnhancedBreadcrumb
      {...props}
      items={items}
      showHome={showHome}
    />
  )
}

export { EnhancedBreadcrumb, AutoBreadcrumb, enhancedBreadcrumbVariants }


