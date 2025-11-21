import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { offlineSyncService, SyncStatus as SyncStatusType } from '../services/offlineSyncService';
import { Colors } from '../constants/Colors';

/**
 * Sync Status Component
 * Shows pending sync count and allows manual sync trigger
 */
export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatusType>({
    isSyncing: false,
    pendingCount: 0,
  });

  useEffect(() => {
    // Initial status
    offlineSyncService.getStatus().then(setStatus);

    // Subscribe to status updates
    const unsubscribe = offlineSyncService.addListener(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = () => {
    offlineSyncService.syncQueue();
  };

  if (status.pendingCount === 0 && !status.isSyncing) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status.isSyncing ? (
          <>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.text}>Syncing...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.warning || '#F59E0B'} />
            <Text style={styles.text}>
              {status.pendingCount} {status.pendingCount === 1 ? 'change' : 'changes'} pending
            </Text>
          </>
        )}
      </View>

      {!status.isSyncing && status.pendingCount > 0 && (
        <TouchableOpacity style={styles.syncButton} onPress={handleManualSync}>
          <Ionicons name="sync" size={16} color={Colors.primary} />
          <Text style={styles.syncButtonText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary || '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
});
