import React, { createContext, useContext, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { ReportService, DashboardService, BusinessIntelligenceData, DailyReportData, WeeklyReportData, InventoryReportData } from '../services';
import { useAuthenticatedAPI, useApiReadiness } from '../hooks';
import type { ComprehensiveDashboardData } from '../services/api/dashboardService';

interface ReportsContextType {
  // Comprehensive dashboard data (always from API)
  dashboardData: ComprehensiveDashboardData | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  
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

// Helper function for empty dashboard data (new stores)
function getEmptyDashboardData(): ComprehensiveDashboardData {
  return {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    totalCategories: 0,
    avgOrderValue: 0,
    inventoryValue: 0,
    customerSatisfaction: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    recentActivities: [],
    lastUpdated: new Date().toISOString(),
    isEmpty: true,
  } as ComprehensiveDashboardData;
}

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { canMakeApiCalls } = useApiReadiness();
  
  // ✅ RETRY LOGIC: Track retry attempts
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 2;
  
  // Custom state for enhanced error handling
  const [customError, setCustomError] = useState<string | null>(null);
  const [customData, setCustomData] = useState<ComprehensiveDashboardData | null>(null);
  
  // Memoize the API function to prevent it from changing on every render
  const dashboardApiFunction = useCallback(() => {
    return DashboardService.getComprehensiveDashboardData();
  }, []);
  
  // Use comprehensive dashboard data API with authentication guard
  const {
    data: apiData,
    loading,
    error: apiError,
    execute: executeApi,
  } = useAuthenticatedAPI(
    dashboardApiFunction,
    {
      immediate: false, // Never auto-load, let components control when to fetch after auth
      onSuccess: (data) => {
        console.log('✅ Dashboard data loaded successfully');
        if (data?.isEmpty) {
          console.log('📊 Database appears to be empty - showing zero states');
        }
        retryCountRef.current = 0; // Reset on success
        setCustomData(data);
        setCustomError(null);
      },
      onError: (error) => {
        console.error('❌ Failed to load comprehensive dashboard data:', error);
      },
    }
  );

  // Wrap the API execution with retry logic
  const refreshDashboardData = useCallback(async (): Promise<ComprehensiveDashboardData> => {
    if (!canMakeApiCalls) {
      console.log('⚠️ Dashboard: Not authenticated');
      throw new Error('Authentication required to load dashboard');
    }

    if (loading) {
      console.log('⚠️ Dashboard: Already loading');
      throw new Error('Dashboard is already loading');
    }

    setCustomError(null);

    try {
      console.log(`📊 Loading dashboard data (attempt ${retryCountRef.current + 1}/${MAX_RETRIES + 1})`);
      
      const result = await executeApi();
      
      // Success path is handled in onSuccess callback
      return result;
      
    } catch (err: any) {
      const status = err.response?.status;
      const errorMessage = err.message || 'Failed to load dashboard';
      
      console.error(`❌ Dashboard load failed (${status}):`, errorMessage);
      
      // Handle different error types
      if (status === 429) {
        const errorMsg = 'Too many requests. Please wait a moment.';
        setCustomError(errorMsg);
        console.warn('⏸️  Rate limited - stopping retries');
        retryCountRef.current = MAX_RETRIES; // Stop retrying on rate limit
        throw new Error(errorMsg);
      } else if (status === 404) {
        const errorMsg = 'Dashboard endpoint not found. API may not be implemented yet.';
        setCustomError(errorMsg);
        console.warn('🚧 Dashboard API not implemented - using empty data');
        const emptyData = getEmptyDashboardData();
        setCustomData(emptyData);
        retryCountRef.current = MAX_RETRIES; // Stop retrying
        return emptyData;
      } else if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        const errorMsg = `Failed to load dashboard. Retry ${retryCountRef.current}/${MAX_RETRIES}`;
        console.log(`🔄 Will retry on next load (${retryCountRef.current}/${MAX_RETRIES})`);
        setCustomError(errorMsg);
        throw new Error(errorMsg);
      } else {
        const errorMsg = 'Failed to load dashboard after multiple attempts.';
        setCustomError(errorMsg);
        console.error('❌ Max retries reached - giving up');
        // Use empty data for new stores
        const emptyData = getEmptyDashboardData();
        setCustomData(emptyData);
        throw new Error(errorMsg);
      }
    }
  }, [canMakeApiCalls, loading, executeApi]);

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
    const dashboardData = customData || apiData;
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
  }, [customData, apiData]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue: ReportsContextType = useMemo(() => ({
    dashboardData: customData || apiData || null,
    loading: loading || false,
    error: customError || apiError || null,
    retryCount: retryCountRef.current,
    refreshDashboardData,
    getDailyReport,
    getWeeklyReport,
    getBusinessIntelligence,
    getInventoryReport,
    getTopItems,
    getKPIs,
  }), [customData, apiData, loading, customError, apiError, refreshDashboardData, getDailyReport, getWeeklyReport, getBusinessIntelligence, getInventoryReport, getTopItems, getKPIs]);

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