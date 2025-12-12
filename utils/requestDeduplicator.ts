/**
 * Request Deduplication Utility
 * Prevents multiple concurrent requests to the same endpoint
 */

type PendingRequest = {
  promise: Promise<any>;
  timestamp: number;
};

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  /**
   * Execute request with deduplication
   * If same request is already pending, return existing promise
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    
    if (pending) {
      const age = Date.now() - pending.timestamp;
      
      // If request is still fresh, return existing promise
      if (age < this.REQUEST_TIMEOUT) {
        console.log(`🔄 Deduplicating request: ${key} (age: ${age}ms)`);
        return pending.promise;
      } else {
        // Request timed out, remove it
        console.log(`⏱️ Request timeout, removing: ${key}`);
        this.pendingRequests.delete(key);
      }
    }

    // Execute new request
    console.log(`🚀 New request: ${key}`);
    const promise = requestFn()
      .finally(() => {
        // Remove from pending after completion
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear specific request
   */
  clearRequest(key: string): void {
    this.pendingRequests.delete(key);
  }
}

export const requestDeduplicator = new RequestDeduplicator();
