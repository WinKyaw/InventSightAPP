import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform, Alert } from 'react-native';
import { API_CONFIG, getSessionInfo, ApiResponse, getNetworkDiagnostics } from './config';
import { tokenManager } from '../../utils/tokenManager';

// Track if we're currently refreshing token to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Create axios instance with base configuration
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor for logging and adding common headers
  client.interceptors.request.use(
    async (config) => {
      const sessionInfo = getSessionInfo();
      
      // Add session headers
      if (config.headers) {
        config.headers['X-User-Login'] = sessionInfo.userLogin;
        config.headers['X-Request-Timestamp'] = sessionInfo.timestamp;
        
        // Add JWT token if available and not a login/signup request
        const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/signup');
        if (!isAuthRequest) {
          const accessToken = await tokenManager.getAccessToken();
          if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
          } else {
            // For non-auth requests without a token, this might be an unauthenticated call
            console.warn('⚠️ API request made without authentication token:', config.url);
          }
        }
      }

      // Log request according to specified format
      console.log(`🔄 InventSightApp API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
      console.log(`👤 Current User's Login: ${sessionInfo.userLogin}`);
      
      // Log request data if present
      if (config.data && __DEV__) {
        console.log('📤 Request Data:', JSON.stringify(config.data, null, 2));
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for logging and error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const sessionInfo = getSessionInfo();
      
      // Log successful response
      console.log(`✅ InventSightApp API Response: ${response.status} - ${response.config.url}`);
      
      // Log response data in development
      if (__DEV__ && response.data) {
        console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      const sessionInfo = getSessionInfo();
      const status = error.response?.status;
      
      // Handle 400 Bad Request (invalid token)
      if (status === 400) {
        const errorData = error.response?.data as any;
        
        // Check if it's a token-related error
        // Looking for common JWT/token error indicators in error message
        const errorMessage = errorData?.error || errorData?.message || '';
        const isTokenError = 
          errorMessage.toLowerCase().includes('tenant_id') || 
          errorMessage.toLowerCase().includes('jwt') ||
          errorMessage.toLowerCase().includes('token');
        
        if (isTokenError) {
          // Silently clear token - DON'T RETRY
          await tokenManager.clearAuthData();
          
          // Return rejection immediately (no retry, no logging)
          return Promise.reject(new Error('INVALID_TOKEN'));
        }
      }

      // Handle 401 Unauthorized
      if (status === 401) {
        const isRefreshRequest = error.config?.url?.includes('/auth/refresh');
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        const isSignupRequest = error.config?.url?.includes('/auth/signup');
        
        // Don't retry refresh, login, or signup requests
        if (isRefreshRequest || isLoginRequest || isSignupRequest) {
          // Don't log auth-related 401s for login/signup/refresh
          return Promise.reject(error);
        }

        // For other 401s, silently clear token and don't retry
        await tokenManager.clearAuthData();
        
        // Return rejection immediately (no retry, no logging)
        return Promise.reject(new Error('UNAUTHORIZED'));
      }

      // Log error response only for non-auth errors
      if (error.response && status !== 400 && status !== 401) {
        console.error(`❌ InventSightApp API Error: ${status} - ${error.config?.url}`);
        console.error(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
        console.error(`👤 Current User's Login: ${sessionInfo.userLogin}`);
        
        // Enhanced authentication error handling
        if (status === 403) {
          console.error('🚫 Authorization Error: Insufficient permissions');
        }
        
        if (__DEV__ && error.response.data) {
          console.error('📥 Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
      } else if (error.request && status !== 400 && status !== 401) {
        console.error('❌ Network Error - No response received');
        console.error(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
        console.error(`👤 Current User's Login: ${sessionInfo.userLogin}`);
        
        // Add network diagnostics
        const diagnostics = getNetworkDiagnostics(error);
        console.error(`🔍 Network Issue: ${diagnostics.issue}`);
        console.error(`💡 ${diagnostics.message}`);
        console.error(`📋 Suggestions:`);
        diagnostics.suggestions.forEach((suggestion, index) => {
          console.error(`   ${index + 1}. ${suggestion}`);
        });
        
        // Show user-friendly error alert
        if (Platform.OS !== 'web') {
          const topSuggestions = diagnostics.suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n');
          Alert.alert(
            'Connection Error',
            `${diagnostics.message}\n\nPlease check:\n${topSuggestions}`,
            [{ text: 'OK' }]
          );
        }
      } else if (!error.response && status !== 400 && status !== 401) {
        console.error('❌ Request Setup Error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create the HTTP client instance
export const httpClient = createHttpClient();

// Generic API request wrapper
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response = await httpClient.request<T>({
      method,
      url,
      data,
      ...config,
    });

    return {
      data: response.data,
      status: response.status,
      message: 'Success',
      timestamp: getSessionInfo().timestamp,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`API Error ${error.response.status}: ${error.response.statusText}`);
    }
    throw new Error(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convenience methods
export const get = <T>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('GET', url, undefined, config);

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('POST', url, data, config);

export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('PUT', url, data, config);

export const del = <T>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('DELETE', url, undefined, config);

// Export the HTTP client for direct use if needed
export default httpClient;