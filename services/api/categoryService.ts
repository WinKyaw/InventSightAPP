import { apiClient } from './apiClient';
import { 
  API_ENDPOINTS, 
  CategoryCountResponse,
  CategoriesResponse
} from './config';

/**
 * Category API Client - Simple HTTP client for category operations
 */
export class CategoryService {
  /**
   * Get total categories count
   */
  static async getCategoriesCount(): Promise<number> {
    const response = await apiClient.get<CategoryCountResponse>(API_ENDPOINTS.CATEGORIES.COUNT);
    return response.totalCategories;
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<CategoriesResponse> {
    return await apiClient.get<CategoriesResponse>(API_ENDPOINTS.CATEGORIES.ALL);
  }
}

export default CategoryService;