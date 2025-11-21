import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { activityTracker } from '../utils/activityTracker';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for tracking user activity and handling inactivity timeout
 * Automatically logs out user after 15 minutes of inactivity
 */
export function useActivityTracking() {
  const { isAuthenticated, logout } = useAuth();

  /**
   * Record user activity
   */
  const recordActivity = useCallback(async () => {
    if (isAuthenticated) {
      await activityTracker.recordActivity();
    }
  }, [isAuthenticated]);

  /**
   * Handle inactivity timeout
   */
  const handleInactivity = useCallback(async () => {
    console.log('⏰ Inactivity timeout reached - logging out user');
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout on inactivity:', error);
    }
  }, [logout]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && isAuthenticated) {
      // App came to foreground - check if user has been inactive too long
      if (activityTracker.isInactive()) {
        handleInactivity();
      } else {
        // Record activity on app foreground
        await recordActivity();
      }
    }
  }, [isAuthenticated, handleInactivity, recordActivity]);

  /**
   * Setup activity tracking
   */
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear activity tracking when not authenticated
      activityTracker.clear();
      return;
    }

    // Record initial activity
    recordActivity();

    // Start monitoring for inactivity
    activityTracker.startMonitoring(handleInactivity);

    // Listen to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      activityTracker.stopMonitoring();
      appStateSubscription.remove();
    };
  }, [isAuthenticated, recordActivity, handleInactivity, handleAppStateChange]);

  return {
    recordActivity,
    getLastActivityTime: () => activityTracker.getLastActivityTime(),
    getTimeSinceLastActivity: () => activityTracker.getTimeSinceLastActivity(),
    isInactive: () => activityTracker.isInactive(),
  };
}
