import { apiClient } from './apiClient';
import { tokenManager } from '../../utils/tokenManager';
import { 
  API_CONFIG,
  API_ENDPOINTS, 
  DashboardSummary,
  DashboardApiEnvelope,
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
  
  // New fields for charts and visualization
  dailySales?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topSellingItems?: Array<{
    name: string;
    quantity: number;
    revenue: number;
    category: string;
  }>;
  bestPerformer?: any;
  recentOrders?: any[];
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
  static async getDashboardSummary(bypassCache: boolean = false): Promise<DashboardSummary> {
    const cacheKey = 'dashboard:summary';
    
    // Check cache first (unless explicitly bypassed)
    if (!bypassCache) {
      const cached = responseCache.get<DashboardSummary>(cacheKey);
      if (cached !== null) {
        console.log('✅ Using cached dashboard summary');
        return cached;
      }
    } else {
      console.log('⚡ Bypassing cache - fetching fresh dashboard data');
      responseCache.invalidate(cacheKey);
    }

    // Verify authentication before making the call
    await this.verifyAuthentication();
    
    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // Retry with exponential backoff on rate limit
      return retryWithBackoff(async () => {
        var testURL = API_ENDPOINTS.DASHBOARD.SUMMARY;
        console.log("URL: " + testURL);
        // Backend wraps response in { summary: {...}, message, timestamp }
        const rawResponse = await apiClient.get<DashboardApiEnvelope>(API_ENDPOINTS.DASHBOARD.SUMMARY);
        
        // Extract .summary if wrapped, otherwise use response directly
        const response: DashboardSummary = rawResponse?.summary || (rawResponse as unknown as DashboardSummary);
        
        console.log('📊 Dashboard API response fields:', Object.keys(response || {}));
        
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
  static async getComprehensiveDashboardData(bypassCache: boolean = false): Promise<ComprehensiveDashboardData> {
    const cacheKey = 'dashboard:comprehensive';
    
    // Check cache first (unless explicitly bypassed)
    if (!bypassCache) {
      const cached = responseCache.get<ComprehensiveDashboardData>(cacheKey);
      if (cached !== null) {
        console.log('✅ Using cached comprehensive dashboard data');
        return cached;
      }
    } else {
      console.log('⚡ Bypassing cache - fetching fresh comprehensive data');
      responseCache.invalidate(cacheKey);
    }

    // Deduplicate concurrent requests
    return requestDeduplicator.execute(cacheKey, async () => {
      // getDashboardSummary already has retry logic, so we don't nest it here
      const dashboardSummary = await this.getDashboardSummary();
      
      // Map recentOrders from backend if recentActivities not present
      const recentActivities = dashboardSummary.recentActivities ||
        (dashboardSummary.recentOrders?.map((order: any) => ({
          id: order.id,
          type: 'sale',
          description: `Order #${order.receiptNumber || order.id}`,
          timestamp: order.createdAt || order.dateTime,
          productName: order.customerName || 'Walk-in Customer',
          quantity: order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1,
          totalValue: order.totalAmount || order.total || 0,
        })) ?? []);

      const data = {
        totalProducts: dashboardSummary.totalProducts ?? 0,
        lowStockItems: dashboardSummary.lowStockItems || [],
        // BUG FIX: backend sends 'lowStockItems' as a number (count), not 'lowStockCount'
        lowStockCount: (dashboardSummary as any).lowStockItems != null && typeof (dashboardSummary as any).lowStockItems === 'number'
          ? (dashboardSummary as any).lowStockItems
          : dashboardSummary.lowStockCount ?? 0,
        totalCategories: dashboardSummary.totalCategories ?? 0,
        recentActivities,
        totalRevenue: dashboardSummary.totalRevenue ?? 0,
        totalOrders: dashboardSummary.totalOrders ?? 0,
        avgOrderValue: dashboardSummary.avgOrderValue ?? 0,
        inventoryValue: dashboardSummary.inventoryValue ?? 0,
        revenueGrowth: dashboardSummary.revenueGrowth ?? 0,
        orderGrowth: dashboardSummary.orderGrowth ?? 0,
        customerSatisfaction: 0, // Not available in summary
        lastUpdated: dashboardSummary.lastUpdated || new Date().toISOString(),
        isEmpty: (dashboardSummary.totalProducts ?? 0) === 0 &&
                (dashboardSummary.totalCategories ?? 0) === 0 &&
                (dashboardSummary.totalOrders ?? 0) === 0,
        // Map new fields from backend
        dailySales: dashboardSummary.dailySales || [],
        topSellingItems: dashboardSummary.topSellingItems || [],
        // BUG FIX: map bestPerformer and recentOrders from backend
        bestPerformer: dashboardSummary.bestPerformer ?? null,
        recentOrders: dashboardSummary.recentOrders ?? [],
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