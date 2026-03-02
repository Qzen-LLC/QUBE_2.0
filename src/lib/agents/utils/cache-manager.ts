/**
 * Cache manager for guardrails generation
 * Improves performance by caching repeated assessments
 */

import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  hash: string;
}

export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  
  constructor(
    maxSize: number = 100,
    ttlMs: number = 15 * 60 * 1000 // 15 minutes default
  ) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }
  
  /**
   * Generate cache key from assessment data
   */
  generateKey(data: any): string {
    const normalized = this.normalizeData(data);
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return hash.substring(0, 16); // Use first 16 chars for brevity
  }
  
  /**
   * Normalize data for consistent hashing
   */
  private normalizeData(data: any): any {
    if (data === null || data === undefined) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeData(item)).sort();
    }
    
    if (typeof data === 'object') {
      const sorted: any = {};
      Object.keys(data)
        .sort()
        .forEach(key => {
          // Skip timestamps and IDs for cache key generation
          if (!['generatedAt', 'id', 'timestamp', 'createdAt', 'updatedAt'].includes(key)) {
            sorted[key] = this.normalizeData(data[key]);
          }
        });
      return sorted;
    }
    
    return data;
  }
  
  /**
   * Get item from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Update hit count
    entry.hits++;
    
    return entry.data;
  }
  
  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
      hash: key
    });
  }
  
  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const entry = this.cache.get(key)!;
    
    // Check expiration
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    avgHits: number;
    oldestEntry: number | null;
  } {
    let totalHits = 0;
    let oldestTimestamp = Date.now();
    
    this.cache.forEach(entry => {
      totalHits += entry.hits;
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    });
    
    const size = this.cache.size;
    const avgHits = size > 0 ? totalHits / size : 0;
    const oldestEntry = size > 0 ? Date.now() - oldestTimestamp : null;
    
    return {
      size,
      maxSize: this.maxSize,
      hitRate: size > 0 ? (totalHits / (totalHits + size)) * 100 : 0,
      avgHits,
      oldestEntry
    };
  }
  
  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTimestamp = Date.now();
    let lruHits = Infinity;
    
    // Find LRU entry (oldest with fewest hits)
    this.cache.forEach((entry, key) => {
      const score = entry.timestamp + (entry.hits * 60000); // Boost score by hits
      if (score < lruTimestamp + (lruHits * 60000)) {
        lruKey = key;
        lruTimestamp = entry.timestamp;
        lruHits = entry.hits;
      }
    });
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
  
  /**
   * Prune expired entries
   */
  pruneExpired(): number {
    const now = Date.now();
    let pruned = 0;
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
        pruned++;
      }
    });
    
    return pruned;
  }
}

/**
 * Decorator for caching async functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: CacheManager,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : cache.generateKey(args);
    
    // Check cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }
    
    // Execute function
    console.log(`Cache miss for key: ${key}`);
    const result = await fn(...args);
    
    // Store in cache
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Global cache instance for guardrails
 */
export const guardrailsCache = new CacheManager(50, 30 * 60 * 1000); // 50 items, 30 min TTL

/**
 * Prompt cache for LLM responses
 */
export const promptCache = new CacheManager(100, 60 * 60 * 1000); // 100 items, 1 hour TTL