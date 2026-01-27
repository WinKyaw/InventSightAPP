import { apiClient } from './apiClient';
import { tokenManager } from '../../utils/tokenManager';
import { 
  API_CONFIG,
  API_ENDPOINTS, 
  DashboardSummary,
  ActivityItem,
  LowStockProduct
} from './config';
import { requestDeduplicator } from '../../utils/requestDeduplicator';
import { responseCache } from '../../utils/responseCache';
import { retryWithBackoff } from '../../utils/retryWithBackoff';

const CACHE_TTL = 30000; // 30 seconds

export interface ComprehensiveDashboardData {
  // Product metrics
  totalProducts: number;
  lowStockItems: LowStockProduct[];
  lowStockCount: number;
  
  // Category metrics
  totalCategories: number;
  
  // Activity metrics
  recentActivities: ActivityItem[];
  
  // Financial metrics
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  inventoryValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerSatisfaction: number;
  
  // Metadata
  lastUpdated: string;
  isEmpty: boolean; // True when database has no data
}

/**
 * Dashboard API Client - Simple HTTP client for dashboard operations
 */
export class DashboardService {
  /**
   * Verify authentication before making API calls
   */
  private static async verifyAuthentication(): Promise<void> {
    const accessToken = await tokenManager.getAccessToken();
    if (!accessToken) {
      throw new Error('Authentication required - no access token available');
    }
  }

  /**
   * Get comprehensive dashboard summary (single API call) with caching
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    const cacheKey = 'dashboard:summary';
    
    // Check cache first
    const cached = responseCache.get<DashboardSummary>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Verify authentication before making the call
    await this.verifyAuthentication();
    
    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        var testURL = API_ENDPOINTS.DASHBOARD.SUMMARY;
        console.log("URL: " + testURL);
        const response = await apiClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY);
        
        // Cache successful response
        responseCache.set(cacheKey, response, CACHE_TTL);
        
        return response;
      });
    });
  }

  /**
   * Get comprehensive dashboard data with caching
   * Note: In a proper backend implementation, this would be a single endpoint
   */
  static async getComprehensiveDashboardData(): Promise<ComprehensiveDashboardData> {
    const cacheKey = 'dashboard:comprehensive';
    
    // Check cache first
    const cached = responseCache.get<ComprehensiveDashboardData>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // getDashboardSummary already has retry logic, so we don't nest it here
      const dashboardSummary = await this.getDashboardSummary();
      
      const data = {
        totalProducts: dashboardSummary.totalProducts,
        lowStockItems: [], // Not available in summary, would need separate endpoint
        lowStockCount: dashboardSummary.lowStockCount,
        totalCategories: dashboardSummary.totalCategories,
        recentActivities: dashboardSummary.recentActivities,
        totalRevenue: dashboardSummary.totalRevenue,
        totalOrders: dashboardSummary.totalOrders,
        avgOrderValue: dashboardSummary.avgOrderValue,
        inventoryValue: dashboardSummary.inventoryValue,
        revenueGrowth: dashboardSummary.revenueGrowth,
        orderGrowth: dashboardSummary.orderGrowth,
        customerSatisfaction: 0, // Not available in summary
        lastUpdated: dashboardSummary.lastUpdated,
        isEmpty: dashboardSummary.totalProducts === 0 && 
                dashboardSummary.totalCategories === 0 && 
                dashboardSummary.totalRevenue === 0
      };
      
      // Cache successful response
      responseCache.set(cacheKey, data, CACHE_TTL);
      
      return data;
    });
  }

  /**
   * Get top performing products/items with caching
   */
  static async getTopItems(limit: number = 10): Promise<Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>> {
    const cacheKey = `dashboard:topItems:${limit}`;
    
    // Check cache first
    const cached = responseCache.get<Array<{
      name: string;
      category: string;
      sales: number;
      quantity: number;
      trend: number;
    }>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Verify authentication before making the call
    await this.verifyAuthentication();
    
    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        // This should be a dedicated backend endpoint
        const response = await apiClient.get<Array<{
          name: string;
          category: string;
          sales: number;
          quantity: number;
          trend: number;
        }>>(`${API_ENDPOINTS.DASHBOARD.SUMMARY}/top-items?limit=${limit}`);
        
        // Cache successful response
        responseCache.set(cacheKey, response, CACHE_TTL);
        
        return response;
      });
    });
  }
}

export default DashboardService;