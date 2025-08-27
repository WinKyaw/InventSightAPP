import React, { createContext, useContext, ReactNode } from 'react';
import { ReportService, BusinessIntelligenceData, DailyReportData, WeeklyReportData, InventoryReportData } from '../services';
import { useMultipleApi } from '../hooks';

interface ReportsContextType {
  // Dashboard data
  dashboardData: {
    daily?: DailyReportData;
    weekly?: WeeklyReportData;
    inventory?: InventoryReportData;
    businessIntelligence?: BusinessIntelligenceData;
  };
  loading: boolean;
  error: string | null;
  loadingStates: Record<string, boolean>;
  
  // Methods
  refreshDashboardData: () => Promise<any>;
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
  // Use multiple API calls for dashboard data
  const {
    data: dashboardData,
    loading,
    error,
    loadingStates,
    execute: refreshDashboardData,
  } = useMultipleApi(
    {
      daily: ReportService.getDailyReport,
      weekly: ReportService.getWeeklyReport,
      inventory: ReportService.getInventoryReport,
      businessIntelligence: ReportService.getBusinessIntelligence,
    },
    {
      immediate: false, // Don't auto-load, let components control when to fetch
      onSuccess: (data) => {
        console.log('📊 Dashboard data loaded successfully:', Object.keys(data));
      },
      onError: (error) => {
        console.error('📊 Failed to load dashboard data:', error);
      },
    }
  );

  // Individual report methods
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
    return await ReportService.getTopItems(limit);
  };

  const getKPIs = async () => {
    return await ReportService.getKPIs();
  };

  return (
    <ReportsContext.Provider value={{
      dashboardData: dashboardData || {},
      loading,
      error,
      loadingStates: loadingStates || {},
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