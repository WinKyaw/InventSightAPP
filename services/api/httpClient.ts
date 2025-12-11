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
      
      // Log error response
      if (error.response) {
        console.error(`❌ InventSightApp API Error: ${error.response.status} - ${error.config?.url}`);
        console.error(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
        console.error(`👤 Current User's Login: ${sessionInfo.userLogin}`);
        
        // Handle 400 errors with tenant_id missing
        if (error.response.status === 400) {
          const errorData: any = error.response.data;
          
          // Check if error is about missing tenant_id or JWT issues
          // Be more robust by checking both error message and potential error codes
          const errorMsg = errorData?.error || errorData?.message || '';
          const isTenantIdError = errorMsg.toLowerCase().includes('tenant_id') || 
                                   errorMsg.toLowerCase().includes('jwt') ||
                                   errorMsg.toLowerCase().includes('token');
          
          if (isTenantIdError) {
            console.warn('⚠️ Invalid JWT token detected (400) - clearing token');
            
            // Clear the invalid token
            await tokenManager.clearAuthData();
            
            // Don't retry - just fail and let AuthContext handle redirect
            return Promise.reject(error);
          }
        }
        
        // Handle token refresh for 401 errors
        if (error.response.status === 401 && !originalRequest._retry) {
          const isRefreshRequest = error.config?.url?.includes('/auth/refresh');
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          const isSignupRequest = error.config?.url?.includes('/auth/signup');
          
          // Don't retry refresh, login, or signup requests
          if (isRefreshRequest || isLoginRequest || isSignupRequest) {
            return Promise.reject(error);
          }

          // Check if we have a refresh token
          const refreshToken = await tokenManager.getRefreshToken();
          if (!refreshToken) {
            console.warn('🚫 No refresh token available - clearing token');
            await tokenManager.clearAuthData();
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          if (isRefreshing) {
            // If refresh is in progress, queue this request
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
              }
              return client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          isRefreshing = true;

          try {
            // Attempt token refresh
            console.log('🔄 Attempting to refresh token...');
            const refreshResponse = await client.post('/auth/refresh', { refreshToken });
            const { accessToken, expiresIn } = refreshResponse.data;
            
            // Update stored token
            await tokenManager.updateAccessToken(accessToken, expiresIn);
            
            // Update the failed request and process queue
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            }
            
            processQueue(null, accessToken);
            isRefreshing = false;
            
            console.log('✅ Token refresh successful');
            return client(originalRequest);
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            processQueue(refreshError, null);
            isRefreshing = false;
            
            // Clear all auth data and redirect to login
            await tokenManager.clearAuthData();
            return Promise.reject(error);
          }
        }
        
        // Enhanced authentication error handling
        if (error.response.status === 401) {
          console.error('🚫 Authentication Error: Invalid or missing credentials');
          console.error('💡 Check API authentication configuration in environment variables');
        } else if (error.response.status === 403) {
          console.error('🚫 Authorization Error: Insufficient permissions');
        }
        
        if (__DEV__ && error.response.data) {
          console.error('📥 Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
      } else if (error.request) {
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
      } else {
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