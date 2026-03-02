import React from 'react'

// Bundle analysis utilities for performance optimization

export interface BundleInfo {
  name: string
  size: number
  gzippedSize?: number
  dependencies: string[]
  chunks: string[]
  modules: ModuleInfo[]
}

export interface ModuleInfo {
  name: string
  size: number
  gzippedSize?: number
  type: 'js' | 'css' | 'image' | 'font' | 'other'
  isExternal: boolean
  isDynamic: boolean
}

export interface BundleAnalysis {
  totalSize: number
  totalGzippedSize?: number
  bundleCount: number
  largestBundles: BundleInfo[]
  duplicateModules: ModuleInfo[]
  unusedModules: ModuleInfo[]
  recommendations: string[]
}

class BundleAnalyzer {
  private bundles: BundleInfo[] = []
  private modules: ModuleInfo[] = []

  constructor() {
    this.analyzeBundles()
  }

  private analyzeBundles() {
    if (typeof window === 'undefined') return

    // Analyze current page resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    resources.forEach(resource => {
      const moduleInfo: ModuleInfo = {
        name: resource.name,
        size: resource.transferSize || 0,
        type: this.getResourceType(resource.name),
        isExternal: !resource.name.includes(window.location.origin),
        isDynamic: resource.name.includes('chunk') || resource.name.includes('dynamic'),
      }

      this.modules.push(moduleInfo)
    })

    // Group modules into bundles
    this.groupModulesIntoBundles()
  }

  private getResourceType(url: string): 'js' | 'css' | 'image' | 'font' | 'other' {
    if (url.endsWith('.js')) return 'js'
    if (url.endsWith('.css')) return 'css'
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font'
    return 'other'
  }

  private groupModulesIntoBundles() {
    const bundleMap = new Map<string, BundleInfo>()

    this.modules.forEach(module => {
      const bundleName = this.getBundleName(module.name)
      
      if (!bundleMap.has(bundleName)) {
        bundleMap.set(bundleName, {
          name: bundleName,
          size: 0,
          dependencies: [],
          chunks: [],
          modules: [],
        })
      }

      const bundle = bundleMap.get(bundleName)!
      bundle.size += module.size
      bundle.modules.push(module)
    })

    this.bundles = Array.from(bundleMap.values())
  }

  private getBundleName(url: string): string {
    // Extract bundle name from URL
    const match = url.match(/\/([^\/]+)\.(js|css)$/)
    if (match) {
      return match[1]
    }
    
    // Fallback to domain-based naming
    if (url.includes('chunk')) return 'chunk'
    if (url.includes('vendor')) return 'vendor'
    if (url.includes('main')) return 'main'
    
    return 'unknown'
  }

  // Get bundle analysis
  getAnalysis(): BundleAnalysis {
    const totalSize = this.bundles.reduce((sum, bundle) => sum + bundle.size, 0)
    const largestBundles = [...this.bundles]
      .sort((a, b) => b.size - a.size)
      .slice(0, 5)

    const duplicateModules = this.findDuplicateModules()
    const unusedModules = this.findUnusedModules()
    const recommendations = this.generateRecommendations()

    return {
      totalSize,
      bundleCount: this.bundles.length,
      largestBundles,
      duplicateModules,
      unusedModules,
      recommendations,
    }
  }

  private findDuplicateModules(): ModuleInfo[] {
    const moduleMap = new Map<string, ModuleInfo[]>()
    
    this.modules.forEach(module => {
      const key = module.name.split('/').pop() || module.name
      if (!moduleMap.has(key)) {
        moduleMap.set(key, [])
      }
      moduleMap.get(key)!.push(module)
    })

    const duplicates: ModuleInfo[] = []
    moduleMap.forEach(modules => {
      if (modules.length > 1) {
        duplicates.push(...modules)
      }
    })

    return duplicates
  }

  private findUnusedModules(): ModuleInfo[] {
    // This is a simplified check - in a real implementation,
    // you'd need to analyze the actual module usage
    return this.modules.filter(module => {
      // Check if module is likely unused based on common patterns
      return (
        module.name.includes('unused') ||
        module.name.includes('deprecated') ||
        module.name.includes('legacy') ||
        (module.size > 100000 && module.isExternal) // Large external modules
      )
    })
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const analysis = this.getAnalysis()

    // Large bundle recommendations
    if (analysis.largestBundles[0]?.size > 500000) {
      recommendations.push('Consider code splitting for large bundles')
    }

    // Duplicate module recommendations
    if (analysis.duplicateModules.length > 0) {
      recommendations.push('Remove duplicate modules to reduce bundle size')
    }

    // Unused module recommendations
    if (analysis.unusedModules.length > 0) {
      recommendations.push('Remove unused modules to improve performance')
    }

    // External dependency recommendations
    const externalModules = this.modules.filter(m => m.isExternal)
    if (externalModules.length > 10) {
      recommendations.push('Consider bundling external dependencies')
    }

    // Dynamic import recommendations
    const dynamicModules = this.modules.filter(m => m.isDynamic)
    if (dynamicModules.length < 3) {
      recommendations.push('Consider using dynamic imports for better code splitting')
    }

    return recommendations
  }

  // Get bundle size breakdown
  getSizeBreakdown() {
    const breakdown = {
      js: 0,
      css: 0,
      images: 0,
      fonts: 0,
      other: 0,
    }

    this.modules.forEach(module => {
      breakdown[module.type] += module.size
    })

    return breakdown
  }

  // Get performance impact score
  getPerformanceImpact(): number {
    const totalSize = this.bundles.reduce((sum, bundle) => sum + bundle.size, 0)
    const jsSize = this.modules
      .filter(m => m.type === 'js')
      .reduce((sum, m) => sum + m.size, 0)

    // Score based on total size and JS size
    let score = 100
    
    if (totalSize > 2000000) score -= 30 // 2MB+
    else if (totalSize > 1000000) score -= 20 // 1MB+
    else if (totalSize > 500000) score -= 10 // 500KB+

    if (jsSize > 1000000) score -= 25 // 1MB+ JS
    else if (jsSize > 500000) score -= 15 // 500KB+ JS
    else if (jsSize > 250000) score -= 10 // 250KB+ JS

    return Math.max(0, score)
  }

  // Generate optimization report
  generateReport(): string {
    const analysis = this.getAnalysis()
    const breakdown = this.getSizeBreakdown()
    const impact = this.getPerformanceImpact()

    return `
Bundle Analysis Report:
======================

Total Bundle Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB
Performance Impact: ${impact}/100

Size Breakdown:
- JavaScript: ${(breakdown.js / 1024 / 1024).toFixed(2)} MB
- CSS: ${(breakdown.css / 1024).toFixed(2)} KB
- Images: ${(breakdown.images / 1024 / 1024).toFixed(2)} MB
- Fonts: ${(breakdown.fonts / 1024).toFixed(2)} KB
- Other: ${(breakdown.other / 1024).toFixed(2)} KB

Largest Bundles:
${analysis.largestBundles.map(bundle => 
  `- ${bundle.name}: ${(bundle.size / 1024 / 1024).toFixed(2)} MB`
).join('\n')}

Issues Found:
- Duplicate modules: ${analysis.duplicateModules.length}
- Unused modules: ${analysis.unusedModules.length}

Recommendations:
${analysis.recommendations.map(rec => `- ${rec}`).join('\n')}
    `.trim()
  }
}

// Global bundle analyzer instance
export const bundleAnalyzer = new BundleAnalyzer()

// React hook for bundle analysis
export const useBundleAnalysis = () => {
  const [analysis, setAnalysis] = React.useState<BundleAnalysis | null>(null)
  const [breakdown, setBreakdown] = React.useState<any>(null)
  const [impact, setImpact] = React.useState<number>(0)

  React.useEffect(() => {
    const updateAnalysis = () => {
      setAnalysis(bundleAnalyzer.getAnalysis())
      setBreakdown(bundleAnalyzer.getSizeBreakdown())
      setImpact(bundleAnalyzer.getPerformanceImpact())
    }

    updateAnalysis()
    
    // Update analysis every 10 seconds
    const interval = setInterval(updateAnalysis, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    analysis,
    breakdown,
    impact,
    generateReport: () => bundleAnalyzer.generateReport(),
  }
}

export default bundleAnalyzer
