/**
 * Cache Manager
 * 
 * Implements caching and performance optimization
 */

/**
 * Cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgHits: number;
}

/**
 * Cache manager
 */
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;

  /**
   * Set cache entry
   */
  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  /**
   * Get cache entry
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    entry.hits++;
    this.hits++;
    return entry.value;
  }

  /**
   * Has key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) return false;

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    const avgHits = this.cache.size > 0
      ? Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0) / this.cache.size
      : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      avgHits,
    };
  }

  /**
   * Get all entries
   */
  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get most accessed entries
   */
  getMostAccessed(limit: number = 10): Array<[string, T, number]> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => [key, entry.value, entry.hits] as [string, T, number])
      .sort((a, b) => b[2] - a[2])
      .slice(0, limit);
  }
}

/**
 * Memoization decorator
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: any[]) => string;
  }
): T {
  const cache = new CacheManager<any>();

  return ((...args: any[]) => {
    const key = options?.keyGenerator
      ? options.keyGenerator(...args)
      : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result, options?.ttl);

    return result;
  }) as T;
}

/**
 * Async memoization decorator
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: {
    ttl?: number;
    keyGenerator?: (...args: any[]) => string;
  }
): T {
  const cache = new CacheManager<any>();

  return (async (...args: any[]) => {
    const key = options?.keyGenerator
      ? options.keyGenerator(...args)
      : JSON.stringify(args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, options?.ttl);

    return result;
  }) as T;
}

/**
 * Create cache manager instance
 */
export function createCacheManager<T>(): CacheManager<T> {
  return new CacheManager<T>();
}
