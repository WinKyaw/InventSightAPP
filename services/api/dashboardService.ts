import { apiClient } from './apiClient';
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
   * Get comprehensive dashboard summary (single API call)
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    return await apiClient.get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY);
  }

  /**
   * Get comprehensive dashboard data
   * Note: In a proper backend implementation, this would be a single endpoint
   */
  static async getComprehensiveDashboardData(): Promise<ComprehensiveDashboardData> {
    // This should be replaced with a single backend endpoint that provides all dashboard data
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