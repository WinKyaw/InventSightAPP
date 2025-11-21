import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineQueue } from '../utils/offlineQueue';
import { offlineSyncService } from '../services/offlineSyncService';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  queueRequest: (request: any) => Promise<void>;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { isOnline: checkIsOnline } = useNetworkStatus();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network status
  useEffect(() => {
    const online = checkIsOnline();
    setIsOnline(online);

    // Start sync when coming online
    if (online) {
      offlineSyncService.startSync();
    } else {
      offlineSyncService.stopSync();
    }
  }, [checkIsOnline]);

  // Subscribe to sync status
  useEffect(() => {
    const unsubscribe = offlineSyncService.addListener((status) => {
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
    });

    // Initial status
    offlineSyncService.getStatus().then((status) => {
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Start sync on mount if online
  useEffect(() => {
    const isCurrentlyOnline = checkIsOnline();
    if (isCurrentlyOnline) {
      offlineSyncService.startSync();
    }

    return () => {
      offlineSyncService.stopSync();
    };
  }, [checkIsOnline]);

  const queueRequest = async (request: any) => {
    await offlineQueue.enqueue(request);
    const count = await offlineQueue.size();
    setPendingCount(count);
  };

  const syncNow = async () => {
    await offlineSyncService.syncQueue();
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        queueRequest,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
