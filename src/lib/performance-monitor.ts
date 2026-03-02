import React from 'react'

// Performance monitoring utilities
export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number
  domContentLoaded?: number
  resourceLoadTime?: number
  memoryUsage?: number
  
  // Navigation timing
  navigationStart?: number
  domLoading?: number
  domInteractive?: number
  domComplete?: number
  loadComplete?: number
}

export interface PerformanceEntry {
  name: string
  startTime: number
  duration: number
  entryType: string
  size?: number
  transferSize?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private isMonitoring = false

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        // LCP observer
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry
          this.metrics.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)

        // FID observer
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)

        // CLS observer
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)

        // FCP observer
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: PerformanceEntry) => {
            this.metrics.fcp = entry.startTime
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)

        // Navigation timing observer
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.ttfb = entry.responseStart - entry.requestStart
            this.metrics.pageLoadTime = entry.loadEventEnd - entry.navigationStart
            this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart
            this.metrics.domInteractive = entry.domInteractive - entry.navigationStart
            this.metrics.domComplete = entry.domComplete - entry.navigationStart
            this.metrics.loadComplete = entry.loadEventEnd - entry.navigationStart
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navObserver)

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          let totalSize = 0
          let totalTransferSize = 0
          
          entries.forEach((entry: any) => {
            totalSize += entry.transferSize || 0
            totalTransferSize += entry.encodedBodySize || 0
          })
          
          this.metrics.resourceLoadTime = totalSize
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)

      } catch (error) {
        console.warn('Performance monitoring initialization failed:', error)
      }
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      this.updateMemoryUsage()
      setInterval(() => this.updateMemoryUsage(), 5000)
    }
  }

  private updateMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
    }
  }

  // Start monitoring
  startMonitoring() {
    this.isMonitoring = true
    this.initializeObservers()
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Get performance score
  getPerformanceScore(): number {
    const { lcp, fid, cls } = this.metrics
    let score = 100

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (lcp) {
      if (lcp > 4000) score -= 30
      else if (lcp > 2500) score -= 15
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (fid) {
      if (fid > 300) score -= 25
      else if (fid > 100) score -= 10
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (cls) {
      if (cls > 0.25) score -= 25
      else if (cls > 0.1) score -= 10
    }

    return Math.max(0, score)
  }

  // Get performance grade
  getPerformanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const score = this.getPerformanceScore()
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  // Measure custom performance
  measure(name: string, fn: () => void | Promise<void>): Promise<number> {
    const start = performance.now()
    
    return Promise.resolve(fn()).then(() => {
      const end = performance.now()
      const duration = end - start
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    })
  }

  // Mark performance points
  mark(name: string) {
    if ('mark' in performance) {
      performance.mark(name)
    }
  }

  // Measure between marks
  measureBetween(startMark: string, endMark: string, name: string): number | null {
    if ('measure' in performance) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        return measure.duration
      } catch (error) {
        console.warn('Performance measure failed:', error)
        return null
      }
    }
    return null
  }

  // Get resource timing
  getResourceTiming(): PerformanceEntry[] {
    if ('getEntriesByType' in performance) {
      return performance.getEntriesByType('resource') as PerformanceEntry[]
    }
    return []
  }

  // Get navigation timing
  getNavigationTiming(): PerformanceEntry | null {
    if ('getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('navigation')
      return entries[0] as PerformanceEntry || null
    }
    return null
  }

  // Generate performance report
  generateReport(): string {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()
    const grade = this.getPerformanceGrade()

    return `
Performance Report:
==================
Score: ${score}/100 (Grade: ${grade})

Core Web Vitals:
- LCP: ${metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'N/A'}
- FID: ${metrics.fid ? `${metrics.fid.toFixed(2)}ms` : 'N/A'}
- CLS: ${metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
- FCP: ${metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'N/A'}
- TTFB: ${metrics.ttfb ? `${metrics.ttfb.toFixed(2)}ms` : 'N/A'}

Page Load Metrics:
- Page Load Time: ${metrics.pageLoadTime ? `${metrics.pageLoadTime.toFixed(2)}ms` : 'N/A'}
- DOM Content Loaded: ${metrics.domContentLoaded ? `${metrics.domContentLoaded.toFixed(2)}ms` : 'N/A'}
- DOM Interactive: ${metrics.domInteractive ? `${metrics.domInteractive.toFixed(2)}ms` : 'N/A'}
- DOM Complete: ${metrics.domComplete ? `${metrics.domComplete.toFixed(2)}ms` : 'N/A'}

Memory Usage: ${metrics.memoryUsage ? `${(metrics.memoryUsage * 100).toFixed(1)}%` : 'N/A'}
    `.trim()
  }

  // Send metrics to analytics
  sendToAnalytics(analyticsEndpoint?: string) {
    const metrics = this.getMetrics()
    const score = this.getPerformanceScore()
    const grade = this.getPerformanceGrade()

    const payload = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics,
      score,
      grade,
    }

    if (analyticsEndpoint) {
      fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(error => {
        console.warn('Failed to send performance metrics:', error)
      })
    }

    // Also send to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', payload)
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({})
  const [score, setScore] = React.useState<number>(0)
  const [grade, setGrade] = React.useState<'A' | 'B' | 'C' | 'D' | 'F'>('F')

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics())
      setScore(performanceMonitor.getPerformanceScore())
      setGrade(performanceMonitor.getPerformanceGrade())
    }

    // Update metrics immediately
    updateMetrics()

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    metrics,
    score,
    grade,
    startMonitoring: () => performanceMonitor.startMonitoring(),
    stopMonitoring: () => performanceMonitor.stopMonitoring(),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    generateReport: () => performanceMonitor.generateReport(),
    sendToAnalytics: (endpoint?: string) => performanceMonitor.sendToAnalytics(endpoint),
  }
}

export default performanceMonitor
