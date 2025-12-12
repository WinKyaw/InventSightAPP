import { apiClient } from './apiClient';
import { 
  API_CONFIG,
  API_ENDPOINTS, 
  CategoryCountResponse,
  CategoriesResponse
} from './config';
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { responseCache } from '../../utils/responseCache';
import { retryWithBackoff } from '../../utils/retryWithBackoff';
import { CacheManager } from '../../utils/cacheManager';

const CACHE_TTL = 30000; // 30 seconds

/**
 * Category API Client with caching and deduplication
 */
export class CategoryService {
  /**
   * Get total categories count with caching
   */
  static async getCategoriesCount(): Promise<number> {
    const cacheKey = 'categories:count';
    
    // Check cache first
    const cached = responseCache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const response = await apiClient.get<CategoryCountResponse>(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES.COUNT}`
        );
        const count = response.totalCategories;
        
        // Cache successful response
        responseCache.set(cacheKey, count, CACHE_TTL);
        
        return count;
      });
    });
  }

  /**
   * Get all categories with caching
   */
  static async getAllCategories(): Promise<CategoriesResponse> {
    const cacheKey = 'categories:all';
    
    // Check cache first
    const cached = responseCache.get<CategoriesResponse>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const response = await apiClient.get<CategoriesResponse>(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES.ALL}`
        );
        
        // Cache successful response
        responseCache.set(cacheKey, response, CACHE_TTL);
        
        return response;
      });
    });
  }

  /**
   * Create category and invalidate cache
   */
  static async createCategory(name: string, description?: string): Promise<void> {
    await apiClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES.CREATE}`, {
      name,
      description,
    });
    
    // Invalidate categories and dashboard cache
    CacheManager.invalidateCategories();
    CacheManager.invalidateDashboard();
  }

  /**
   * Update category and invalidate cache
   */
  static async updateCategory(id: number, name: string, description?: string): Promise<void> {
    await apiClient.put(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES.UPDATE(id)}`, {
      name,
      description,
    });
    
    // Invalidate categories and dashboard cache
    CacheManager.invalidateCategories();
    CacheManager.invalidateDashboard();
  }

  /**
   * Delete category and invalidate cache
   */
  static async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES.DELETE(id)}`);
    
    // Invalidate categories and dashboard cache
    CacheManager.invalidateCategories();
    CacheManager.invalidateDashboard();
  }
}

export default CategoryService;