import { apiClient } from './apiClient';
import { tokenManager } from '../../utils/tokenManager';
import { 
  API_CONFIG,
  API_ENDPOINTS, 
  DailyReportData, 
  WeeklyReportData, 
  InventoryReportData, 
  BusinessIntelligenceData 
} from './config';

/**
 * Report API Client - Simple HTTP client for report operations
 */
export class ReportService {
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
   * Get daily business report
   */
  static async getDailyReport(date?: string): Promise<DailyReportData> {
    await this.verifyAuthentication();
    const params = date ? `?date=${date}` : '';
    return await apiClient.get<DailyReportData>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REPORTS.DAILY}${params}`);
  }

  /**
   * Get weekly analytics report
   */
  static async getWeeklyReport(startDate?: string, endDate?: string): Promise<WeeklyReportData> {
    await this.verifyAuthentication();
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REPORTS.WEEKLY}?${queryString}` : API_ENDPOINTS.REPORTS.WEEKLY;
    
    return await apiClient.get<WeeklyReportData>(url);
  }

  /**
   * Get inventory status report
   */
  static async getInventoryReport(): Promise<InventoryReportData> {
    await this.verifyAuthentication();
    return await apiClient.get<InventoryReportData>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REPORTS.INVENTORY}`);
  }

  /**
   * Get comprehensive business intelligence data
   */
  static async getBusinessIntelligence(): Promise<BusinessIntelligenceData> {
    await this.verifyAuthentication();
    return await apiClient.get<BusinessIntelligenceData>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REPORTS.BUSINESS_INTELLIGENCE}`);
  }

  /**
   * Get dashboard summary data (combines multiple reports)
   */
  static async getDashboardData(): Promise<{
    daily: DailyReportData;
    weekly: WeeklyReportData;
    inventory: InventoryReportData;
    businessIntelligence: BusinessIntelligenceData;
  }> {
    // Backend should provide this combined endpoint, but for compatibility:
    const [daily, weekly, inventory, businessIntelligence] = await Promise.all([
      this.getDailyReport(),
      this.getWeeklyReport(),
      this.getInventoryReport(),
      this.getBusinessIntelligence(),
    ]);

    return {
      daily,
      weekly,
      inventory,
      businessIntelligence,
    };
  }

  /**
   * Get sales data for specific date range
   */
  static async getSalesData(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    dailyBreakdown: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  }> {
    const weekly = await this.getWeeklyReport(startDate, endDate);
    
    return {
      totalRevenue: weekly.totalRevenue,
      totalOrders: weekly.totalOrders,
      avgOrderValue: weekly.avgOrderValue,
      dailyBreakdown: weekly.dailyBreakdown,
    };
  }

  /**
   * Get top performing items
   */
  static async getTopItems(limit: number = 10): Promise<Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>> {
    const businessIntelligence = await this.getBusinessIntelligence();
    return businessIntelligence.topPerformers.slice(0, limit);
  }

  /**
   * Get KPI data for dashboard
   */
  static async getKPIs(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    customerSatisfaction: number;
    revenueGrowth: number;
    orderGrowth: number;
  }> {
    const businessIntelligence = await this.getBusinessIntelligence();
    
    return {
      totalRevenue: businessIntelligence.kpis.totalRevenue,
      totalOrders: businessIntelligence.kpis.totalOrders,
      avgOrderValue: businessIntelligence.kpis.avgOrderValue,
      customerSatisfaction: businessIntelligence.kpis.customerSatisfaction,
      revenueGrowth: businessIntelligence.trends.revenueGrowth,
      orderGrowth: businessIntelligence.trends.orderGrowth,
    };
  }
}

export default ReportService;