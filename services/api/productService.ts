import { get } from './httpClient';
import { 
  API_ENDPOINTS, 
  ProductCountResponse, 
  LowStockResponse
} from './config';

export class ProductService {
  /**
   * Get total products count
   */
  static async getProductsCount(): Promise<number> {
    try {
      const response = await get<ProductCountResponse>(API_ENDPOINTS.PRODUCTS.COUNT);
      return response.data.totalProducts;
    } catch (error) {
      console.error('Failed to fetch products count:', error);
      // Return 0 for empty database scenario
      return 0;
    }
  }

  /**
   * Get products with low inventory
   */
  static async getLowStockProducts(): Promise<LowStockResponse> {
    try {
      const response = await get<LowStockResponse>(API_ENDPOINTS.PRODUCTS.LOW_STOCK);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      // Return empty response for error scenarios
      return {
        lowStockItems: [],
        count: 0
      };
    }
  }

  /**
   * Get all products
   */
  static async getAllProducts(): Promise<any[]> {
    try {
      const response = await get<any[]>(API_ENDPOINTS.PRODUCTS.ALL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all products:', error);
      return [];
    }
  }
}

export default ProductService;