import { offlineQueue, QueuedRequest } from '../utils/offlineQueue';
import { httpClient } from '../services/api/httpClient';

const SYNC_INTERVAL = 30 * 1000; // 30 seconds

/**
 * Offline Sync Service
 * Handles background synchronization of queued requests
 */
class OfflineSyncService {
  private static instance: OfflineSyncService;
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private listeners: Array<(status: SyncStatus) => void> = [];

  private constructor() {}

  public static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService();
    }
    return OfflineSyncService.instance;
  }

  /**
   * Start background sync
   */
  public startSync(): void {
    if (this.syncTimer) {
      console.log('🔄 Sync already running');
      return;
    }

    console.log('🔄 Starting background sync (every 30 seconds)');

    // Run immediately
    this.syncQueue();

    // Then run every 30 seconds
    this.syncTimer = setInterval(() => {
      this.syncQueue();
    }, SYNC_INTERVAL);
  }

  /**
   * Stop background sync
   */
  public stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ Stopped background sync');
    }
  }

  /**
   * Manually trigger sync
   */
  public async syncQueue(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      const queueSize = await offlineQueue.size();

      if (queueSize === 0) {
        this.notifyListeners({ isSyncing: false, pendingCount: 0, lastSyncTime: Date.now() });
        return;
      }

      console.log(`🔄 Starting sync for ${queueSize} queued requests`);
      this.notifyListeners({ isSyncing: true, pendingCount: queueSize });

      let successCount = 0;
      let failCount = 0;

      // Process queue in FIFO order
      while (true) {
        const request = await offlineQueue.getNext();
        if (!request) break;

        try {
          await this.processRequest(request);
          await offlineQueue.remove(request.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync request ${request.id}:`, error);
          await offlineQueue.incrementRetry(request.id);
          failCount++;
        }
      }

      const remainingCount = await offlineQueue.size();
      console.log(`✅ Sync complete: ${successCount} successful, ${failCount} failed, ${remainingCount} remaining`);

      this.notifyListeners({
        isSyncing: false,
        pendingCount: remainingCount,
        lastSyncTime: Date.now(),
        successCount,
        failCount,
      });
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners({ isSyncing: false, error: 'Sync failed' });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single queued request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    console.log(`📤 Processing: ${request.method} ${request.endpoint}`);

    const config: any = {
      method: request.method,
      url: request.endpoint,
      headers: request.headers || {},
    };

    if (request.payload && (request.method === 'POST' || request.method === 'PUT')) {
      config.data = request.payload;
    }

    await httpClient.request(config);
  }

  /**
   * Add sync status listener
   */
  public addListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  public async getStatus(): Promise<SyncStatus> {
    const pendingCount = await offlineQueue.size();
    return {
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncTime: Date.now(),
    };
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: number;
  successCount?: number;
  failCount?: number;
  error?: string;
}

// Export singleton instance
export const offlineSyncService = OfflineSyncService.getInstance();
