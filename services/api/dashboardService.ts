import { apiClient } from './apiClient';
import { tokenManager } from '../../utils/tokenManager';
import { 
  API_ENDPOINTS, 
  DashboardSummary,
  ActivityItem,
  LowStockProduct
} from './config';

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
   * Get comprehensive dashboard summary (single API call)
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    // Verify authentication before making the call
    await this.verifyAuthentication();
    
    var testURL = "http://localhost:8080" + API_ENDPOINTS.DASHBOARD.SUMMARY;
    console.log("URL: " + testURL);
    return await apiClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY);
  }

  /**
   * Get comprehensive dashboard data
   * Note: In a proper backend implementation, this would be a single endpoint
   */
  static async getComprehensiveDashboardData(): Promise<ComprehensiveDashboardData> {
    // Verify authentication is done in getDashboardSummary call
    const dashboardSummary = await this.getDashboardSummary();
    
    return {
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
  }

  /**
   * Get top performing products/items
   */
  static async getTopItems(limit: number = 10): Promise<Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>> {
    // Verify authentication before making the call
    await this.verifyAuthentication();
    
    // This should be a dedicated backend endpoint
    return await apiClient.get<Array<{
      name: string;
      category: string;
      sales: number;
      quantity: number;
      trend: number;
    }>>(`${API_ENDPOINTS.DASHBOARD.SUMMARY}/top-items?limit=${limit}`);
  }
}

export default DashboardService;