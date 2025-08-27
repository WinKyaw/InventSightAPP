import { useState, useCallback, useEffect } from 'react';

// Generic API state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook configuration options
interface UseApiOptions {
  immediate?: boolean; // Execute immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Generic hook for API state management
 * Provides loading, error, and data states with retry functionality
 */
export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Execute the API call
  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiFunction();
      setState({
        data,
        loading: false,
        error: null,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  }, [apiFunction, onSuccess, onError]);

  // Reset state to initial values
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    // Convenience getters
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isEmpty: !state.loading && !state.error && state.data === null,
  };
}

/**
 * Hook for API calls with parameters
 * Useful when you need to pass different parameters to the same API function
 */
export function useApiWithParams<T, P>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiFunction(params);
      setState({
        data,
        loading: false,
        error: null,
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isEmpty: !state.loading && !state.error && state.data === null,
  };
}

/**
 * Hook for managing multiple API calls
 * Useful for dashboard or complex components that need data from multiple endpoints
 */
export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> },
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<{
    data: Partial<T>;
    loading: boolean;
    error: string | null;
    loadingStates: { [K in keyof T]?: boolean };
  }>({
    data: {},
    loading: false,
    error: null,
    loadingStates: {},
  });

  const execute = useCallback(async () => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      loadingStates: Object.keys(apiCalls).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    }));

    try {
      const results = await Promise.allSettled(
        Object.entries(apiCalls).map(([key, apiCall]) => 
          apiCall().then(data => ({ key, data }))
        )
      );

      const data: Partial<T> = {};
      const errors: string[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, data: resultData } = result.value;
          (data as any)[key] = resultData;
        } else {
          errors.push(result.reason?.message || 'Unknown error');
        }
      });

      if (errors.length > 0) {
        const errorMessage = `Some API calls failed: ${errors.join(', ')}`;
        setState({
          data,
          loading: false,
          error: errorMessage,
          loadingStates: {},
        });
        
        if (onError) {
          onError(errorMessage);
        }
      } else {
        setState({
          data,
          loading: false,
          error: null,
          loadingStates: {},
        });
        
        if (onSuccess) {
          onSuccess(data);
        }
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState({
        data: {},
        loading: false,
        error: errorMessage,
        loadingStates: {},
      });
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    }
  }, [apiCalls, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: {},
      loading: false,
      error: null,
      loadingStates: {},
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    loadingStates: state.loadingStates,
    execute,
    reset,
    isLoading: state.loading,
    isError: !!state.error,
    isSuccess: !state.loading && !state.error,
    isEmpty: !state.loading && !state.error && Object.keys(state.data).length === 0,
  };
}

export default useApi;