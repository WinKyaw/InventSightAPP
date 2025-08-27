import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, getSessionInfo, ApiResponse } from './config';

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
    (config) => {
      const sessionInfo = getSessionInfo();
      
      // Add session headers
      if (config.headers) {
        config.headers['X-User-Login'] = sessionInfo.userLogin;
        config.headers['X-Request-Timestamp'] = sessionInfo.timestamp;
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
    (error: AxiosError) => {
      const sessionInfo = getSessionInfo();
      
      // Log error response
      if (error.response) {
        console.error(`❌ InventSightApp API Error: ${error.response.status} - ${error.config?.url}`);
        console.error(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
        console.error(`👤 Current User's Login: ${sessionInfo.userLogin}`);
        
        if (__DEV__ && error.response.data) {
          console.error('📥 Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
      } else if (error.request) {
        console.error('❌ Network Error - No response received');
        console.error(`📅 Current Date and Time (UTC): ${sessionInfo.timestamp}`);
        console.error(`👤 Current User's Login: ${sessionInfo.userLogin}`);
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