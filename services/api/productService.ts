import { get, post, put, del } from './httpClient';
import { 
  API_ENDPOINTS, 
  ProductCountResponse, 
  LowStockResponse,
  Product,
  ProductsListResponse,
  CreateProductRequest,
  UpdateProductRequest,
  UpdateStockRequest,
  SearchProductsParams,
  ProductSearchResponse
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
   * Get all products with pagination
   */
  static async getAllProducts(page = 1, limit = 20, sortBy = 'name', sortOrder: 'asc' | 'desc' = 'asc'): Promise<ProductsListResponse> {
    try {
      const response = await get<ProductsListResponse>(
        `${API_ENDPOINTS.PRODUCTS.ALL}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all products:', error);
      return {
        products: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<Product | null> {
    try {
      const response = await get<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Create new product
   */
  static async createProduct(productData: CreateProductRequest): Promise<Product | null> {
    try {
      const response = await post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, productData);
      return response.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  /**
   * Update existing product
   */
  static async updateProduct(id: number, updates: UpdateProductRequest): Promise<Product | null> {
    try {
      const response = await put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<boolean> {
    try {
      await del(API_ENDPOINTS.PRODUCTS.DELETE(id));
      return true;
    } catch (error) {
      console.error(`Failed to delete product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update product stock
   */
  static async updateProductStock(id: number, stockData: UpdateStockRequest): Promise<Product | null> {
    try {
      const response = await put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id), stockData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update stock for product with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search products with filters
   */
  static async searchProducts(params: SearchProductsParams): Promise<ProductSearchResponse> {
    try {
      const queryString = new URLSearchParams();
      
      if (params.query) queryString.append('query', params.query);
      if (params.categoryId) queryString.append('categoryId', params.categoryId.toString());
      if (params.minPrice !== undefined) queryString.append('minPrice', params.minPrice.toString());
      if (params.maxPrice !== undefined) queryString.append('maxPrice', params.maxPrice.toString());
      if (params.inStock !== undefined) queryString.append('inStock', params.inStock.toString());
      if (params.lowStock !== undefined) queryString.append('lowStock', params.lowStock.toString());
      if (params.page) queryString.append('page', params.page.toString());
      if (params.limit) queryString.append('limit', params.limit.toString());
      if (params.sortBy) queryString.append('sortBy', params.sortBy);
      if (params.sortOrder) queryString.append('sortOrder', params.sortOrder);

      const response = await get<ProductSearchResponse>(
        `${API_ENDPOINTS.PRODUCTS.SEARCH}?${queryString.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to search products:', error);
      return {
        products: [],
        totalCount: 0,
        searchQuery: params.query,
        appliedFilters: params
      };
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    categoryId: number, 
    page = 1, 
    limit = 20, 
    sortBy = 'name', 
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<ProductsListResponse> {
    try {
      const response = await get<ProductsListResponse>(
        `${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch products for category ${categoryId}:`, error);
      return {
        products: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasMore: false
      };
    }
  }
}

export default ProductService;