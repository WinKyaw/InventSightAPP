import { apiClient } from './apiClient';
import { 
  API_CONFIG,
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
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { responseCache } from '../../utils/responseCache';
import { retryWithBackoff } from '../../utils/retryWithBackoff';

const CACHE_TTL = 30000; // 30 seconds

/**
 * Product API Client - Simple HTTP client for product operations
 */
export class ProductService {
  /**
   * Get total products count with caching and deduplication
   */
  static async getProductsCount(): Promise<number> {
    const cacheKey = 'products:count';
    
    // Check cache first
    const cached = responseCache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const response = await apiClient.get<ProductCountResponse>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.COUNT);
        const count = response.totalProducts;
        
        // Cache successful response
        responseCache.set(cacheKey, count, CACHE_TTL);
        
        return count;
      });
    });
  }

  /**
   * Get products with low inventory with caching and deduplication
   */
  static async getLowStockProducts(): Promise<LowStockResponse> {
    const cacheKey = 'products:lowStock';
    
    // Check cache first
    const cached = responseCache.get<LowStockResponse>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const response = await apiClient.get<LowStockResponse>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.LOW_STOCK);
        
        // Cache successful response
        responseCache.set(cacheKey, response, CACHE_TTL);
        
        return response;
      });
    });
  }

  /**
   * Get all products with pagination with caching and deduplication
   */
  static async getAllProducts(page = 1, limit = 20, sortBy = 'name', sortOrder: 'asc' | 'desc' = 'asc'): Promise<ProductsListResponse> {
    const cacheKey = `products:all:${page}:${limit}:${sortBy}:${sortOrder}`;
    
    // Check cache first
    const cached = responseCache.get<ProductsListResponse>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        const fullUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS.ALL}?page=${page - 1}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
        const response = await apiClient.get<any>(fullUrl);

        // Map backend response to frontend interface
        const result = {
          products: (response.products || []).map((product: any) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            category: product.category,
            description: product.description,
            sku: product.sku,
            minStock: product.lowStockThreshold, // If available
            maxStock: product.maxQuantity,       // Map from maxQuantity
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          })),
          totalItems: response.totalItems,
          currentPage: (response.currentPage || 0) + 1, // convert 0-based to 1-based if needed
          totalPages: response.totalPages,
          hasMore: response.currentPage < response.totalPages - 1,
        };
        
        // Cache successful response
        responseCache.set(cacheKey, result, CACHE_TTL);
        
        return result;
      });
    });
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<Product> {
    return await apiClient.get<Product>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.BY_ID(id));
  }

  /**
   * Create new product and invalidate cache
   */
  static async createProduct(productData: CreateProductRequest): Promise<Product> {
    const product = await apiClient.post<Product>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.CREATE, productData);
    
    // Invalidate products cache
    responseCache.invalidatePattern(/^products:/);
    
    return product;
  }

  /**
   * Update existing product and invalidate cache
   */
  static async updateProduct(id: number, updates: UpdateProductRequest): Promise<Product> {
    const product = await apiClient.put<Product>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.UPDATE(id), updates);
    
    // Invalidate products cache
    responseCache.invalidatePattern(/^products:/);
    responseCache.invalidate(`product:${id}`);
    
    return product;
  }

  /**
   * Delete product and invalidate cache
   */
  static async deleteProduct(id: number): Promise<boolean> {
    await apiClient.delete<void>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.DELETE(id));
    
    // Invalidate products cache
    responseCache.invalidatePattern(/^products:/);
    responseCache.invalidate(`product:${id}`);
    
    return true;
  }

  /**
   * Update product stock and invalidate cache
   */
  static async updateProductStock(id: number, stockData: UpdateStockRequest): Promise<Product> {
    const product = await apiClient.put<Product>(API_CONFIG.BASE_URL+API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id), stockData);
    
    // Invalidate products cache (stock affects low stock and counts)
    responseCache.invalidatePattern(/^products:/);
    responseCache.invalidate(`product:${id}`);
    
    return product;
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

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS.SEARCH}?${queryString.toString()}`;
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
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId)}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    return await apiClient.get<ProductsListResponse>(url);
  }
}

export default ProductService;