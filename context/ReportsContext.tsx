import React, { createContext, useContext, ReactNode } from 'react';
import { ReportService, DashboardService, BusinessIntelligenceData, DailyReportData, WeeklyReportData, InventoryReportData } from '../services';
import { useApi } from '../hooks';
import type { ComprehensiveDashboardData } from '../services/api/dashboardService';

interface ReportsContextType {
  // Comprehensive dashboard data (always from API)
  dashboardData: ComprehensiveDashboardData | null;
  loading: boolean;
  error: string | null;
  
  // Methods
  refreshDashboardData: () => Promise<ComprehensiveDashboardData>;
  getDailyReport: (date?: string) => Promise<DailyReportData>;
  getWeeklyReport: (startDate?: string, endDate?: string) => Promise<WeeklyReportData>;
  getBusinessIntelligence: () => Promise<BusinessIntelligenceData>;
  getInventoryReport: () => Promise<InventoryReportData>;
  getTopItems: (limit?: number) => Promise<Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>>;
  getKPIs: () => Promise<{
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    customerSatisfaction: number;
    revenueGrowth: number;
    orderGrowth: number;
  }>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  // Use comprehensive dashboard data API
  const {
    data: dashboardData,
    loading,
    error,
    execute: refreshDashboardData,
  } = useApi(
    DashboardService.getComprehensiveDashboardData,
    {
      immediate: false, // Don't auto-load, let components control when to fetch
      onSuccess: (data) => {
        console.log('📊 Comprehensive dashboard data loaded successfully');
        if (data.isEmpty) {
          console.log('📊 Database appears to be empty - showing zero states');
        }
      },
      onError: (error) => {
        console.error('📊 Failed to load comprehensive dashboard data:', error);
      },
    }
  );

  // Individual report methods (for backward compatibility)
  const getDailyReport = async (date?: string): Promise<DailyReportData> => {
    return await ReportService.getDailyReport(date);
  };

  const getWeeklyReport = async (startDate?: string, endDate?: string): Promise<WeeklyReportData> => {
    return await ReportService.getWeeklyReport(startDate, endDate);
  };

  const getBusinessIntelligence = async (): Promise<BusinessIntelligenceData> => {
    return await ReportService.getBusinessIntelligence();
  };

  const getInventoryReport = async (): Promise<InventoryReportData> => {
    return await ReportService.getInventoryReport();
  };

  const getTopItems = async (limit: number = 10) => {
    return await DashboardService.getTopItems(limit);
  };

  const getKPIs = async () => {
    // Extract KPIs from comprehensive dashboard data if available
    if (dashboardData) {
      return {
        totalRevenue: dashboardData.totalRevenue,
        totalOrders: dashboardData.totalOrders,
        avgOrderValue: dashboardData.avgOrderValue,
        customerSatisfaction: dashboardData.customerSatisfaction,
        revenueGrowth: dashboardData.revenueGrowth,
        orderGrowth: dashboardData.orderGrowth,
      };
    }
    
    // Fallback to ReportService
    return await ReportService.getKPIs();
  };

  return (
    <ReportsContext.Provider value={{
      dashboardData,
      loading,
      error,
      refreshDashboardData,
      getDailyReport,
      getWeeklyReport,
      getBusinessIntelligence,
      getInventoryReport,
      getTopItems,
      getKPIs,
    }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
}