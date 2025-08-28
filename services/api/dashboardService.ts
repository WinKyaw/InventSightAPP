import { get } from './httpClient';
import { ProductService } from './productService';
import { CategoryService } from './categoryService';
import { ActivityService } from './activityService';
import { ReportService } from './reportService';
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

export class DashboardService {
  /**
   * Get comprehensive dashboard summary (single API call if available)
   */
  static async getDashboardSummary(): Promise<DashboardSummary | null> {
    try {
      const response = await get<DashboardSummary>(API_ENDPOINTS.DASHBOARD.SUMMARY);
      return response.data;
    } catch (error) {
      console.error('Dashboard summary endpoint not available:', error);
      return null;
    }
  }

  /**
   * Get comprehensive dashboard data by aggregating multiple API calls
   */
  static async getComprehensiveDashboardData(): Promise<ComprehensiveDashboardData> {
    try {
      // Try to get dashboard summary first (single API call)
      const dashboardSummary = await this.getDashboardSummary();
      
      if (dashboardSummary) {
        return {
          totalProducts: dashboardSummary.totalProducts,
          lowStockItems: [], // Would need additional API call if needed
          lowStockCount: dashboardSummary.lowStockCount,
          totalCategories: dashboardSummary.totalCategories,
          recentActivities: dashboardSummary.recentActivities,
          totalRevenue: dashboardSummary.totalRevenue,
          totalOrders: dashboardSummary.totalOrders,
          avgOrderValue: dashboardSummary.avgOrderValue,
          inventoryValue: dashboardSummary.inventoryValue,
          revenueGrowth: dashboardSummary.revenueGrowth,
          orderGrowth: dashboardSummary.orderGrowth,
          customerSatisfaction: 0, // Default value
          lastUpdated: dashboardSummary.lastUpdated,
          isEmpty: dashboardSummary.totalProducts === 0 && 
                  dashboardSummary.totalCategories === 0 && 
                  dashboardSummary.totalRevenue === 0
        };
      }

      // Fallback: Make individual API calls
      console.log('📊 Fetching dashboard data from individual endpoints...');
      
      const [
        totalProducts,
        lowStockData,
        totalCategories,
        recentActivities,
        kpis,
        businessIntelligence
      ] = await Promise.allSettled([
        ProductService.getProductsCount(),
        ProductService.getLowStockProducts(),
        CategoryService.getCategoriesCount(),
        ActivityService.getRecentActivities(10),
        ReportService.getKPIs(),
        ReportService.getBusinessIntelligence()
      ]);

      // Extract successful results or use defaults
      const productsCount = totalProducts.status === 'fulfilled' ? totalProducts.value : 0;
      const lowStock = lowStockData.status === 'fulfilled' ? lowStockData.value : { lowStockItems: [], count: 0 };
      const categoriesCount = totalCategories.status === 'fulfilled' ? totalCategories.value : 0;
      const activities = recentActivities.status === 'fulfilled' ? recentActivities.value : [];
      const kpiData = kpis.status === 'fulfilled' ? kpis.value : {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        customerSatisfaction: 0,
        revenueGrowth: 0,
        orderGrowth: 0
      };
      const biData = businessIntelligence.status === 'fulfilled' ? businessIntelligence.value : null;

      // Calculate inventory value (could be from a separate endpoint)
      const inventoryValue = biData?.kpis ? 
        (biData.kpis.totalRevenue * 0.6) : // Estimate based on revenue
        0;

      const isEmpty = productsCount === 0 && 
                     categoriesCount === 0 && 
                     kpiData.totalRevenue === 0;

      return {
        totalProducts: productsCount,
        lowStockItems: lowStock.lowStockItems,
        lowStockCount: lowStock.count,
        totalCategories: categoriesCount,
        recentActivities: activities,
        totalRevenue: kpiData.totalRevenue,
        totalOrders: kpiData.totalOrders,
        avgOrderValue: kpiData.avgOrderValue,
        inventoryValue,
        revenueGrowth: kpiData.revenueGrowth,
        orderGrowth: kpiData.orderGrowth,
        customerSatisfaction: kpiData.customerSatisfaction,
        lastUpdated: new Date().toISOString(),
        isEmpty
      };

    } catch (error) {
      console.error('Failed to fetch comprehensive dashboard data:', error);
      
      // Return empty state for complete failure
      return {
        totalProducts: 0,
        lowStockItems: [],
        lowStockCount: 0,
        totalCategories: 0,
        recentActivities: [],
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        inventoryValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0,
        customerSatisfaction: 0,
        lastUpdated: new Date().toISOString(),
        isEmpty: true
      };
    }
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
    try {
      return await ReportService.getTopItems(limit);
    } catch (error) {
      console.error('Failed to fetch top items:', error);
      return [];
    }
  }
}

export default DashboardService;