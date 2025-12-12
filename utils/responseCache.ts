/**
 * Response Cache Utility
 * Cache API responses to reduce redundant calls
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  /**
   * Get cached response if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if cache entry is still valid
    if (now < entry.expiresAt) {
      const age = now - entry.timestamp;
      console.log(`✅ Cache hit: ${key} (age: ${age}ms)`);
      return entry.data;
    }

    // Cache expired, remove it
    console.log(`⏱️ Cache expired: ${key}`);
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
    
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log(`🗑️ Cache cleared`);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries matching pattern`);
  }
}

export const responseCache = new ResponseCache();
