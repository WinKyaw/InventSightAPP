/**
 * Simple in-memory response cache with invalidation support.
 *
 * Used to:
 * - Cache API responses to avoid redundant network requests
 * - Signal to consumers (e.g. Dashboard) that data is stale and should be re-fetched
 */
export class ResponseCache {
  private cache: Map<string, any> = new Map();
  private lastClearedAt: number = 0;

  /**
   * Store a value in the cache under the given key.
   */
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  /**
   * Retrieve a cached value by key. Returns undefined if not found.
   */
  get(key: string): any {
    return this.cache.get(key);
  }

  /**
   * Clear all cache entries and record the time of clearing.
   * Consumers can compare this timestamp against their last-load time to detect staleness.
   */
  clear(): void {
    console.log('🗑️  Clearing all cache entries');
    this.cache.clear();
    this.lastClearedAt = Date.now();
  }

  /**
   * Clear cache entries whose keys contain the given pattern string.
   */
  clearPattern(pattern: string): void {
    console.log(`🗑️  Clearing cache entries matching: ${pattern}`);
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    this.lastClearedAt = Date.now();
    console.log(`✅ Cleared ${keysToDelete.length} cache entries`);
  }

  /**
   * Returns the timestamp (ms since epoch) of the last cache clear, or 0 if never cleared.
   * Useful for consumers to detect whether their cached data has been invalidated.
   */
  getLastClearedAt(): number {
    return this.lastClearedAt;
  }

  /**
   * Returns cache statistics for debugging.
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const responseCache = new ResponseCache();
