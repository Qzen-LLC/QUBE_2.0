import React from 'react'

// Lazy loading utilities for better performance

export interface LazyLoadOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  triggerOnce?: boolean
  skip?: boolean
}

export interface LazyLoadState {
  isLoaded: boolean
  isVisible: boolean
  hasError: boolean
}

// Intersection Observer hook for lazy loading
export const useLazyLoad = (options: LazyLoadOptions = {}) => {
  const [state, setState] = React.useState<LazyLoadState>({
    isLoaded: false,
    isVisible: false,
    hasError: false,
  })

  const elementRef = React.useRef<HTMLElement>(null)
  const observerRef = React.useRef<IntersectionObserver | null>(null)

  React.useEffect(() => {
    if (options.skip || !elementRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isVisible: true }))
          
          if (options.triggerOnce) {
            observer.disconnect()
          }
        } else {
          setState(prev => ({ ...prev, isVisible: false }))
        }
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.1,
      }
    )

    observer.observe(elementRef.current)
    observerRef.current = observer

    return () => {
      observer.disconnect()
    }
  }, [options.root, options.rootMargin, options.threshold, options.triggerOnce, options.skip])

  const load = React.useCallback(() => {
    setState(prev => ({ ...prev, isLoaded: true }))
  }, [])

  const error = React.useCallback(() => {
    setState(prev => ({ ...prev, hasError: true }))
  }, [])

  return {
    elementRef,
    isLoaded: state.isLoaded,
    isVisible: state.isVisible,
    hasError: state.hasError,
    load,
    error,
  }
}

// Lazy image component
export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
  options?: LazyLoadOptions
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder,
  fallback,
  onLoad,
  onError,
  options = {},
  ...props
}) => {
  const { elementRef, isVisible, isLoaded, hasError, load, error } = useLazyLoad(options)
  const [currentSrc, setCurrentSrc] = React.useState(placeholder || '')

  React.useEffect(() => {
    if (isVisible && !isLoaded && !hasError) {
      const img = new Image()
      img.onload = () => {
        setCurrentSrc(src)
        load()
        onLoad?.()
      }
      img.onerror = () => {
        if (fallback) {
          setCurrentSrc(fallback)
        }
        error()
        onError?.()
      }
      img.src = src
    }
  }, [isVisible, isLoaded, hasError, src, fallback, load, error, onLoad, onError])

  return (
    <img
      ref={elementRef}
      src={currentSrc}
      {...props}
    />
  )
}

// Lazy component wrapper
export interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  options?: LazyLoadOptions
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div>Loading...</div>,
  options = {},
}) => {
  const { elementRef, isVisible } = useLazyLoad(options)

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback}
    </div>
  )
}

// Lazy route component
export const lazyRoute = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  return React.lazy(importFunc)
}

// Lazy module loader
export class LazyModuleLoader {
  private loadedModules = new Map<string, any>()
  private loadingModules = new Map<string, Promise<any>>()

  async loadModule<T = any>(modulePath: string): Promise<T> {
    // Return cached module if already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath)
    }

    // Return existing promise if already loading
    if (this.loadingModules.has(modulePath)) {
      return this.loadingModules.get(modulePath)
    }

    // Start loading module
    const loadPromise = this.loadModuleInternal<T>(modulePath)
    this.loadingModules.set(modulePath, loadPromise)

    try {
      const module = await loadPromise
      this.loadedModules.set(modulePath, module)
      this.loadingModules.delete(modulePath)
      return module
    } catch (error) {
      this.loadingModules.delete(modulePath)
      throw error
    }
  }

  private async loadModuleInternal<T>(modulePath: string): Promise<T> {
    // Dynamic import
    const module = await import(modulePath)
    return module.default || module
  }

  // Preload module
  async preloadModule(modulePath: string): Promise<void> {
    if (!this.loadedModules.has(modulePath) && !this.loadingModules.has(modulePath)) {
      this.loadModule(modulePath)
    }
  }

  // Check if module is loaded
  isModuleLoaded(modulePath: string): boolean {
    return this.loadedModules.has(modulePath)
  }

  // Get loaded modules
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys())
  }

  // Clear cache
  clearCache(): void {
    this.loadedModules.clear()
    this.loadingModules.clear()
  }
}

// Global lazy module loader
export const lazyModuleLoader = new LazyModuleLoader()

// Lazy data fetcher
export interface LazyDataOptions {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  retry?: number
  retryDelay?: number
}

export const useLazyData = <T extends unknown>(
  key: string,
  fetcher: () => Promise<T>,
  options: LazyDataOptions = {}
) => {
  const [data, setData] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  const { elementRef } = useLazyLoad({
    triggerOnce: true,
    skip: !options.enabled,
  })

  const fetchData = React.useCallback(async () => {
    if (!isVisible || isLoading || data) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [isVisible, isLoading, data, fetcher])

  React.useEffect(() => {
    if (isVisible) {
      fetchData()
    }
  }, [isVisible, fetchData])

  return {
    elementRef,
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}

// Lazy list component
export interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
  overscan?: number
  onLoadMore?: () => void
  hasMore?: boolean
  loadingComponent?: React.ReactNode
}

export const LazyList = <T extends unknown>({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5,
  onLoadMore,
  hasMore = false,
  loadingComponent = <div>Loading...</div>,
}: LazyListProps<T>) => {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)

    // Load more when near the end
    if (
      hasMore &&
      onLoadMore &&
      newScrollTop + containerHeight >= totalHeight - 100
    ) {
      onLoadMore()
    }
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
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
          {hasMore && loadingComponent}
        </div>
      </div>
    </div>
  )
}

export default {
  useLazyLoad,
  LazyImage,
  LazyComponent,
  lazyRoute,
  lazyModuleLoader,
  useLazyData,
  LazyList,
}


