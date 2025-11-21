import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  timestamp: number;
  retryCount: number;
  headers?: Record<string, string>;
}

/**
 * Offline Queue Manager
 * Manages queued API requests when device is offline
 */
class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private queue: QueuedRequest[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.loadQueue();
  }

  public static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`📦 Loaded ${this.queue.length} items from offline queue`);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
      this.isInitialized = true;
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Wait for initialization
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.loadQueue();
    }
  }

  /**
   * Add request to queue
   */
  public async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    await this.ensureInitialized();

    const queuedRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    console.log(`📥 Added request to offline queue: ${request.method} ${request.endpoint}`);
  }

  /**
   * Get all queued requests
   */
  public async getQueue(): Promise<QueuedRequest[]> {
    await this.ensureInitialized();
    return [...this.queue];
  }

  /**
   * Get next request to process (FIFO)
   */
  public async getNext(): Promise<QueuedRequest | null> {
    await this.ensureInitialized();
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Remove request from queue
   */
  public async remove(requestId: string): Promise<void> {
    await this.ensureInitialized();
    this.queue = this.queue.filter(req => req.id !== requestId);
    await this.saveQueue();
    console.log(`✅ Removed request from offline queue: ${requestId}`);
  }

  /**
   * Increment retry count for a request
   */
  public async incrementRetry(requestId: string): Promise<void> {
    await this.ensureInitialized();

    const request = this.queue.find(req => req.id === requestId);
    if (request) {
      request.retryCount++;

      // Remove if exceeded max retries
      if (request.retryCount >= MAX_RETRIES) {
        console.warn(`⚠️ Request exceeded max retries, removing: ${requestId}`);
        await this.remove(requestId);
      } else {
        await this.saveQueue();
      }
    }
  }

  /**
   * Clear all queued requests
   */
  public async clear(): Promise<void> {
    await this.ensureInitialized();
    this.queue = [];
    await this.saveQueue();
    console.log('🗑️ Cleared offline queue');
  }

  /**
   * Get queue size
   */
  public async size(): Promise<number> {
    await this.ensureInitialized();
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  public async isEmpty(): Promise<boolean> {
    await this.ensureInitialized();
    return this.queue.length === 0;
  }

  /**
   * Get pending count (for UI display)
   */
  public async getPendingCount(): Promise<number> {
    return await this.size();
  }
}

// Export singleton instance
export const offlineQueue = OfflineQueueManager.getInstance();
