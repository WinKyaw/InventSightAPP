import { get } from './httpClient';
import { 
  API_ENDPOINTS, 
  CategoryCountResponse
} from './config';

export class CategoryService {
  /**
   * Get total categories count
   */
  static async getCategoriesCount(): Promise<number> {
    try {
      const response = await get<CategoryCountResponse>(API_ENDPOINTS.CATEGORIES.COUNT);
      return response.data.totalCategories;
    } catch (error) {
      console.error('Failed to fetch categories count:', error);
      // Return 0 for empty database scenario
      return 0;
    }
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<any[]> {
    try {
      const response = await get<any[]>(API_ENDPOINTS.CATEGORIES.ALL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all categories:', error);
      return [];
    }
  }
}

export default CategoryService;