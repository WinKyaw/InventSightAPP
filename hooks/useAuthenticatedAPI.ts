import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useApi, UseApiOptions } from './useApi';

/**
 * Authentication-aware API hook
 * Ensures API calls are only made after user authentication is verified
 */
export function useAuthenticatedAPI<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { isAuthenticated, isInitialized } = useAuth();

  // Create an authenticated API function wrapper
  const authenticatedApiFunction = useCallback(async (): Promise<T> => {
    // Prevent API calls if authentication is not yet initialized
    if (!isInitialized) {
      throw new Error('Authentication not yet initialized');
    }

    // Prevent API calls if user is not authenticated
    if (!isAuthenticated) {
      throw new Error('User not authenticated - please log in');
    }

    // Execute the actual API call only when authenticated
    return await apiFunction();
  }, [apiFunction, isAuthenticated, isInitialized]);

  // Use the regular useApi hook but with authentication wrapper
  return useApi(authenticatedApiFunction, {
    ...options,
    // Never execute immediately - always wait for authentication
    immediate: false,
  });
}

/**
 * Hook to check if API calls should be allowed
 * Useful for components that need to know authentication state before attempting calls
 */
export function useApiReadiness() {
  try {
    const { isAuthenticated, isInitialized, isLoading } = useAuth();

    return {
      isReady: isInitialized && isAuthenticated && !isLoading,
      isAuthenticating: isLoading || !isInitialized,
      isUnauthenticated: isInitialized && !isAuthenticated && !isLoading,
      canMakeApiCalls: isInitialized && isAuthenticated && !isLoading,
    };
  } catch (error) {
    // Handle case where AuthContext is not available
    console.warn('⚠️ useApiReadiness: AuthContext not available, returning safe defaults');
    return {
      isReady: false,
      isAuthenticating: true,
      isUnauthenticated: false,
      canMakeApiCalls: false,
    };
  }
}