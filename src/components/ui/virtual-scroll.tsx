import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const virtualScrollVariants = cva(
  "relative overflow-auto",
  {
    variants: {
      variant: {
        default: "",
        minimal: "scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent",
        hidden: "scrollbar-none",
      },
      size: {
        sm: "h-32",
        default: "h-64",
        lg: "h-96",
        xl: "h-[32rem]",
        full: "h-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface VirtualScrollProps<T>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof virtualScrollVariants> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  onScroll?: (scrollTop: number) => void
  onItemsRendered?: (startIndex: number, endIndex: number) => void
  className?: string
}

const VirtualScroll = <T,>({
  items,
  itemHeight,
  renderItem,
  overscan = 5,
  onScroll,
  onItemsRendered,
  className,
  variant,
  size,
  ...props
}: VirtualScrollProps<T>) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(0)

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  // Handle scroll
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }, [onScroll])

  // Update container height
  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Notify about rendered items
  React.useEffect(() => {
    onItemsRendered?.(startIndex, endIndex)
  }, [startIndex, endIndex, onItemsRendered])

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div
      ref={containerRef}
      className={cn(virtualScrollVariants({ variant, size }), className)}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Infinite scroll variant
export interface InfiniteVirtualScrollProps<T>
  extends Omit<VirtualScrollProps<T>, 'items'> {
  items: T[]
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  loadingComponent?: React.ReactNode
  endComponent?: React.ReactNode
  threshold?: number
}

const InfiniteVirtualScroll = <T,>({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  loadingComponent,
  endComponent,
  threshold = 1000,
  ...props
}: InfiniteVirtualScrollProps<T>) => {
  const [allItems, setAllItems] = React.useState<T[]>(items)

  // Update items when props change
  React.useEffect(() => {
    setAllItems(items)
  }, [items])

  // Handle load more
  const handleItemsRendered = React.useCallback((startIndex: number, endIndex: number) => {
    if (
      hasMore &&
      !isLoading &&
      endIndex >= allItems.length - 10 && // Load more when near the end
      allItems.length > 0
    ) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore, allItems.length])

  // Render loading component
  const renderItem = React.useCallback((item: T, index: number) => {
    if (index === allItems.length && isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          {loadingComponent || (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      )
    }

    if (index === allItems.length && !hasMore) {
      return (
        <div className="flex items-center justify-center p-4">
          {endComponent || (
            <div className="text-muted-foreground text-sm">
              No more items
            </div>
          )}
        </div>
      )
    }

    return props.renderItem(item, index)
  }, [allItems.length, isLoading, hasMore, loadingComponent, endComponent, props.renderItem])

  return (
    <VirtualScroll
      {...props}
      items={allItems}
      renderItem={renderItem}
      onItemsRendered={handleItemsRendered}
    />
  )
}

// Windowed list for better performance
export interface WindowedListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

const WindowedList = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
}: WindowedListProps<T>) => {
  const [scrollTop, setScrollTop] = React.useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  )

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div
      className={cn("relative overflow-auto", className)}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { VirtualScroll, InfiniteVirtualScroll, WindowedList, virtualScrollVariants }


