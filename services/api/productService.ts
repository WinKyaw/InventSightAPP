import { apiClient } from './apiClient';
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

/**
 * Product API Client - Simple HTTP client for product operations
 */
export class ProductService {
  /**
   * Get total products count
   */
  static async getProductsCount(): Promise<number> {
    const response = await apiClient.get<ProductCountResponse>(API_ENDPOINTS.PRODUCTS.COUNT);
    return response.totalProducts;
  }

  /**
   * Get products with low inventory
   */
  static async getLowStockProducts(): Promise<LowStockResponse> {
    return await apiClient.get<LowStockResponse>(API_ENDPOINTS.PRODUCTS.LOW_STOCK);
  }

  /**
   * Get all products with pagination
   */
  static async getAllProducts(page = 1, limit = 20, sortBy = 'name', sortOrder: 'asc' | 'desc' = 'asc'): Promise<ProductsListResponse> {
    const url = `${API_ENDPOINTS.PRODUCTS.ALL}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    const response = await apiClient.get<ProductsListResponse>(url);
    // Ensure we return a properly structured response even if the API returns unexpected data
    return {
      products: response.products || [],
      totalCount: response.totalCount || 0,
      currentPage: response.currentPage || page,
      totalPages: response.totalPages || 1,
      hasMore: response.hasMore || false
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<Product> {
    return await apiClient.get<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  }

  /**
   * Create new product
   */
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    return await apiClient.post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, productData);
  }

  /**
   * Update existing product
   */
  static async updateProduct(id: number, updates: UpdateProductRequest): Promise<Product> {
    return await apiClient.put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), updates);
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<boolean> {
    await apiClient.delete<void>(API_ENDPOINTS.PRODUCTS.DELETE(id));
    return true;
  }

  /**
   * Update product stock
   */
  static async updateProductStock(id: number, stockData: UpdateStockRequest): Promise<Product> {
    return await apiClient.put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id), stockData);
  }

  /**
   * Search products with filters
   */
  static async searchProducts(params: SearchProductsParams): Promise<ProductSearchResponse> {
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

    const url = `${API_ENDPOINTS.PRODUCTS.SEARCH}?${queryString.toString()}`;
    return await apiClient.get<ProductSearchResponse>(url);
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
    const url = `${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return await apiClient.get<ProductsListResponse>(url);
  }
}

export default ProductService;