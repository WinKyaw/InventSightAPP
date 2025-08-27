import { get } from './httpClient';
import { 
  API_ENDPOINTS, 
  DailyReportData, 
  WeeklyReportData, 
  InventoryReportData, 
  BusinessIntelligenceData 
} from './config';

export class ReportService {
  /**
   * Get daily business report
   */
  static async getDailyReport(date?: string): Promise<DailyReportData> {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await get<DailyReportData>(`${API_ENDPOINTS.REPORTS.DAILY}${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch daily report:', error);
      throw error;
    }
  }

  /**
   * Get weekly analytics report
   */
  static async getWeeklyReport(startDate?: string, endDate?: string): Promise<WeeklyReportData> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const queryString = params.toString();
      const url = queryString ? `${API_ENDPOINTS.REPORTS.WEEKLY}?${queryString}` : API_ENDPOINTS.REPORTS.WEEKLY;
      
      const response = await get<WeeklyReportData>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      throw error;
    }
  }

  /**
   * Get inventory status report
   */
  static async getInventoryReport(): Promise<InventoryReportData> {
    try {
      const response = await get<InventoryReportData>(API_ENDPOINTS.REPORTS.INVENTORY);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive business intelligence data
   */
  static async getBusinessIntelligence(): Promise<BusinessIntelligenceData> {
    try {
      const response = await get<BusinessIntelligenceData>(API_ENDPOINTS.REPORTS.BUSINESS_INTELLIGENCE);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch business intelligence data:', error);
      throw error;
    }
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
    try {
      // Fetch all reports concurrently for better performance
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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
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
    try {
      const weekly = await this.getWeeklyReport(startDate, endDate);
      
      return {
        totalRevenue: weekly.totalRevenue,
        totalOrders: weekly.totalOrders,
        avgOrderValue: weekly.avgOrderValue,
        dailyBreakdown: weekly.dailyBreakdown,
      };
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
      throw error;
    }
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
    try {
      const businessIntelligence = await this.getBusinessIntelligence();
      return businessIntelligence.topPerformers.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch top items:', error);
      throw error;
    }
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
    try {
      const businessIntelligence = await this.getBusinessIntelligence();
      
      return {
        totalRevenue: businessIntelligence.kpis.totalRevenue,
        totalOrders: businessIntelligence.kpis.totalOrders,
        avgOrderValue: businessIntelligence.kpis.avgOrderValue,
        customerSatisfaction: businessIntelligence.kpis.customerSatisfaction,
        revenueGrowth: businessIntelligence.trends.revenueGrowth,
        orderGrowth: businessIntelligence.trends.orderGrowth,
      };
    } catch (error) {
      console.error('Failed to fetch KPIs:', error);
      throw error;
    }
  }
}

export default ReportService;