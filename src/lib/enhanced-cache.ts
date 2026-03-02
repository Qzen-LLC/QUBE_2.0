import { Redis } from 'ioredis'

// Enhanced cache configuration
export interface CacheConfig {
  defaultTTL: number
  maxSize: number
  enableCompression: boolean
  enableEncryption: boolean
  keyPrefix: string
}

// Cache entry with metadata
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  compressed?: boolean
  encrypted?: boolean
  tags?: string[]
}

// Cache statistics
export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  hitRate: number
}

// Enhanced cache manager
export class EnhancedCacheManager {
  private redis: Redis | null = null
  private memoryCache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  }
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300, // 5 minutes
      maxSize: 1000,
      enableCompression: true,
      enableEncryption: false,
      keyPrefix: 'qzen:',
      ...config,
    }

    // Initialize Redis if available
    this.initializeRedis()
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        })
        
        // Test connection
        await this.redis.ping()
        console.log('✅ Redis cache initialized')
      }
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory cache only:', error)
      this.redis = null
    }
  }

  // Generate cache key with prefix
  private generateKey(key: string): string {
    return `${this.config.keyPrefix}${key}`
  }

  // Compress data if enabled
  private async compress(data: any): Promise<any> {
    if (!this.config.enableCompression) return data
    
    try {
      // Simple compression for small objects
      if (typeof data === 'string' && data.length > 100) {
        return Buffer.from(data).toString('base64')
      }
      return data
    } catch (error) {
      console.warn('Compression failed:', error)
      return data
    }
  }

  // Decompress data if compressed
  private async decompress(data: any, compressed: boolean): Promise<any> {
    if (!compressed || !this.config.enableCompression) return data
    
    try {
      if (typeof data === 'string') {
        return Buffer.from(data, 'base64').toString()
      }
      return data
    } catch (error) {
      console.warn('Decompression failed:', error)
      return data
    }
  }

  // Set cache entry
  async set<T>(key: string, data: T, ttl?: number, tags?: string[]): Promise<void> {
    const cacheKey = this.generateKey(key)
    const entryTTL = ttl || this.config.defaultTTL
    const compressed = await this.compress(data)
    
    const entry: CacheEntry<T> = {
      data: compressed,
      timestamp: Date.now(),
      ttl: entryTTL,
      compressed: this.config.enableCompression,
      tags,
    }

    try {
      // Try Redis first
      if (this.redis) {
        await this.redis.setex(cacheKey, entryTTL, JSON.stringify(entry))
      } else {
        // Fallback to memory cache
        this.memoryCache.set(cacheKey, entry)
        this.cleanupMemoryCache()
      }
      
      this.stats.sets++
      this.updateStats()
    } catch (error) {
      console.error('Cache set error:', error)
      // Fallback to memory cache
      this.memoryCache.set(cacheKey, entry)
    }
  }

  // Get cache entry
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key)
    
    try {
      let entry: CacheEntry<T> | null = null

      // Try Redis first
      if (this.redis) {
        const redisData = await this.redis.get(cacheKey)
        if (redisData) {
          entry = JSON.parse(redisData)
        }
      } else {
        // Fallback to memory cache
        entry = this.memoryCache.get(cacheKey) || null
      }

      if (!entry) {
        this.stats.misses++
        this.updateStats()
        return null
      }

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await this.delete(key)
        this.stats.misses++
        this.updateStats()
        return null
      }

      // Decompress data
      const data = await this.decompress(entry.data, entry.compressed || false)
      
      this.stats.hits++
      this.updateStats()
      return data
    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      this.updateStats()
      return null
    }
  }

  // Delete cache entry
  async delete(key: string): Promise<void> {
    const cacheKey = this.generateKey(key)
    
    try {
      if (this.redis) {
        await this.redis.del(cacheKey)
      } else {
        this.memoryCache.delete(cacheKey)
      }
      
      this.stats.deletes++
      this.updateStats()
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  // Delete entries by tags
  async deleteByTags(tags: string[]): Promise<void> {
    try {
      if (this.redis) {
        // Get all keys with tags
        const keys = await this.redis.keys(`${this.config.keyPrefix}*`)
        const pipeline = this.redis.pipeline()
        
        for (const key of keys) {
          const data = await this.redis.get(key)
          if (data) {
            const entry: CacheEntry = JSON.parse(data)
            if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
              pipeline.del(key)
            }
          }
        }
        
        await pipeline.exec()
      } else {
        // Memory cache cleanup
        for (const [key, entry] of this.memoryCache.entries()) {
          if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
            this.memoryCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache delete by tags error:', error)
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(`${this.config.keyPrefix}*`)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        this.memoryCache.clear()
      }
      
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        size: 0,
        hitRate: 0,
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Update statistics
  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    this.stats.size = this.memoryCache.size
  }

  // Cleanup expired entries from memory cache
  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.config.maxSize) return

    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.memoryCache.delete(key))

    // If still over limit, remove oldest entries
    if (this.memoryCache.size > this.config.maxSize) {
      const entries = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize)
      toRemove.forEach(([key]) => this.memoryCache.delete(key))
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    try {
      if (this.redis) {
        await this.redis.ping()
        return { status: 'healthy', details: { redis: 'connected', memory: this.memoryCache.size } }
      } else {
        return { status: 'degraded', details: { redis: 'unavailable', memory: this.memoryCache.size } }
      }
    } catch (error) {
      return { status: 'unhealthy', details: { error: error.message } }
    }
  }
}

// Global cache instance
export const cache = new EnhancedCacheManager({
  defaultTTL: 300, // 5 minutes
  maxSize: 1000,
  enableCompression: true,
  keyPrefix: 'qzen:',
})

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl?: number,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : `func:${fn.name}:${JSON.stringify(args)}`
    
    // Try cache first
    const cached = await cache.get(key)
    if (cached !== null) {
      return cached
    }
    
    // Execute function
    const result = await fn(...args)
    
    // Cache result
    await cache.set(key, result, ttl)
    
    return result
  }) as T
}

// Cache middleware for API routes
export function withCache<T = any>(
  ttl: number = 300,
  keyGenerator?: (req: Request) => string
) {
  return (handler: (req: Request) => Promise<T>) => {
    return async (req: Request): Promise<T> => {
      const key = keyGenerator ? keyGenerator(req) : `api:${req.url}`
      
      // Try cache first
      const cached = await cache.get<T>(key)
      if (cached !== null) {
        return cached
      }
      
      // Execute handler
      const result = await handler(req)
      
      // Cache result
      await cache.set(key, result, ttl)
      
      return result
    }
  }
}

export default cache


