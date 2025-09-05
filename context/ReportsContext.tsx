import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { ReportService, DashboardService, BusinessIntelligenceData, DailyReportData, WeeklyReportData, InventoryReportData } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';
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
  const { canMakeApiCalls } = useApiReadiness();
  
  // Memoize the API function to prevent it from changing on every render
  const dashboardApiFunction = useCallback(() => {
    return DashboardService.getComprehensiveDashboardData();
  }, []);
  
  // Use comprehensive dashboard data API with authentication guard
  const {
    data: dashboardData,
    loading,
    error,
    execute: refreshDashboardData,
  } = useAuthenticatedAPI(
    dashboardApiFunction,
    {
      immediate: false, // Never auto-load, let components control when to fetch after auth
      onSuccess: (data) => {
        console.log('📊 Comprehensive dashboard data loaded successfully');
        if (data?.isEmpty) {
          console.log('📊 Database appears to be empty - showing zero states');
        }
      },
      onError: (error) => {
        console.error('📊 Failed to load comprehensive dashboard data:', error);
      },
    }
  );

  // Individual report methods (for backward compatibility with authentication guards)
  const getDailyReport = useCallback(async (date?: string): Promise<DailyReportData> => {
    if (!canMakeApiCalls) {
      throw new Error('Authentication required to fetch daily report');
    }
    return await ReportService.getDailyReport(date);
  }, [canMakeApiCalls]);

  const getWeeklyReport = useCallback(async (startDate?: string, endDate?: string): Promise<WeeklyReportData> => {
    if (!canMakeApiCalls) {
      throw new Error('Authentication required to fetch weekly report');
    }
    return await ReportService.getWeeklyReport(startDate, endDate);
  }, [canMakeApiCalls]);

  const getBusinessIntelligence = useCallback(async (): Promise<BusinessIntelligenceData> => {
    if (!canMakeApiCalls) {
      throw new Error('Authentication required to fetch business intelligence data');
    }
    return await ReportService.getBusinessIntelligence();
  }, [canMakeApiCalls]);

  const getInventoryReport = useCallback(async (): Promise<InventoryReportData> => {
    if (!canMakeApiCalls) {
      throw new Error('Authentication required to fetch inventory report');
    }
    return await ReportService.getInventoryReport();
  }, [canMakeApiCalls]);

  const getTopItems = useCallback(async (limit: number = 10) => {
    if (!canMakeApiCalls) {
      throw new Error('Authentication required to fetch top items');
    }
    return await DashboardService.getTopItems(limit);
  }, [canMakeApiCalls]);

  const getKPIs = useCallback(async () => {
    // Extract KPIs from comprehensive dashboard data if available
    if (dashboardData) {
      return {
        totalRevenue: dashboardData.totalRevenue || 0,
        totalOrders: dashboardData.totalOrders || 0,
        avgOrderValue: dashboardData.avgOrderValue || 0,
        customerSatisfaction: dashboardData.customerSatisfaction || 0,
        revenueGrowth: dashboardData.revenueGrowth || 0,
        orderGrowth: dashboardData.orderGrowth || 0,
      };
    }
    
    // Fallback to ReportService
    return await ReportService.getKPIs();
  }, [dashboardData]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: ReportsContextType = useMemo(() => ({
    dashboardData: dashboardData || null,
    loading: loading || false,
    error: error || null,
    refreshDashboardData,
    getDailyReport,
    getWeeklyReport,
    getBusinessIntelligence,
    getInventoryReport,
    getTopItems,
    getKPIs,
  }), [dashboardData, loading, error, refreshDashboardData, getDailyReport, getWeeklyReport, getBusinessIntelligence, getInventoryReport, getTopItems, getKPIs]);

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports(): ReportsContextType {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
}