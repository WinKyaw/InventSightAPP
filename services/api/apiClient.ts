import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from './config';
import { tokenManager } from '../../utils/tokenManager';

/**
 * Simple API Client for making HTTP requests to the Java backend
 * Focused on basic request/response handling with minimal complexity
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config) => {
        // Add JWT token for authenticated requests
        const isAuthRequest = config.url?.includes('/auth/login') || config.url?.includes('/auth/signup');
        if (!isAuthRequest) {
          const accessToken = await tokenManager.getAccessToken();
          if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
          }
        }

        // Add user context headers
        config.headers['X-User-Login'] = API_CONFIG.USER_LOGIN;
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - basic error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        
        console.error(`❌ API Error: ${status} - ${url}`);
        
        if (status === 401) {
          console.warn('⚠️ API: Authentication required');
          // Token expired or invalid - let the app handle re-authentication
        } else if (status === 404) {
          console.warn(`⚠️ API: Endpoint not found - ${url}`);
          // Don't retry 404s - endpoint may not be implemented yet
        } else if (status === 429) {
          console.error('⚠️ API: Rate limited - too many requests');
          // Add exponential backoff in calling code
        } else if (status >= 500) {
          console.error(`⚠️ API: Server error (${status}) - ${url}`);
        } else if (!error.response) {
          console.error('⚠️ API: Network error - no response received');
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;