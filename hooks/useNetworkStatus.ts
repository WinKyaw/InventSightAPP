import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Custom hook for monitoring network connectivity
 * Returns current network status and utilities for checking connectivity
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      // Log network changes
      if (state.isConnected && state.isInternetReachable) {
        console.log('📶 Network: Connected (' + state.type + ')');
      } else if (state.isConnected && !state.isInternetReachable) {
        console.log('📶 Network: Connected but no internet access');
      } else {
        console.log('📶 Network: Disconnected');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Check current network state
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.error('Failed to check network connection:', error);
      return false;
    }
  }, []);

  /**
   * Check if device is online (has both connection and internet access)
   */
  const isOnline = useCallback((): boolean => {
    return isConnected === true && isInternetReachable === true;
  }, [isConnected, isInternetReachable]);

  /**
   * Check if device is offline
   */
  const isOffline = useCallback((): boolean => {
    return !isOnline();
  }, [isOnline]);

  return {
    isConnected,
    isInternetReachable,
    connectionType,
    isOnline,
    isOffline,
    checkConnection,
  };
}
