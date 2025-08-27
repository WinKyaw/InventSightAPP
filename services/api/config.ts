import { Employee } from '../../types';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:8080',
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'),
  USER_LOGIN: process.env.USER_LOGIN || 'WinKyaw',
  // Authentication configuration
  AUTH_TOKEN: process.env.API_AUTH_TOKEN || '',
  AUTH_TYPE: process.env.API_AUTH_TYPE || 'bearer', // bearer, apikey, basic
  API_KEY: process.env.API_KEY || '',
  USERNAME: process.env.API_USERNAME || 'WinKyaw',
  PASSWORD: process.env.API_PASSWORD || '',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  // Reports endpoints
  REPORTS: {
    DAILY: '/reports/daily',
    WEEKLY: '/reports/weekly', 
    INVENTORY: '/reports/inventory',
    BUSINESS_INTELLIGENCE: '/reports/business-intelligence',
  },
  // Employee endpoints
  EMPLOYEES: {
    ALL: '/employees',
    BY_ID: (id: string | number) => `/employees/${id}`,
    CHECKED_IN: '/employees/checked-in',
    SEARCH: '/employees/search',
    CREATE: '/employees',
  },
};

// Session Information
export const getSessionInfo = () => ({
  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  userLogin: API_CONFIG.USER_LOGIN,
});

// Authentication helper functions
export const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  
  // Add authentication based on configured type
  if (API_CONFIG.AUTH_TOKEN && API_CONFIG.AUTH_TYPE === 'bearer') {
    headers['Authorization'] = `Bearer ${API_CONFIG.AUTH_TOKEN}`;
  } else if (API_CONFIG.API_KEY && API_CONFIG.AUTH_TYPE === 'apikey') {
    headers['X-API-Key'] = API_CONFIG.API_KEY;
  } else if (API_CONFIG.USERNAME && API_CONFIG.PASSWORD && API_CONFIG.AUTH_TYPE === 'basic') {
    const credentials = btoa(`${API_CONFIG.USERNAME}:${API_CONFIG.PASSWORD}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }
  
  return headers;
};

// Extended interfaces for API responses
export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface WeeklyReportData {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export interface InventoryReportData {
  totalItems: number;
  lowStockItems: Array<{
    id: number;
    name: string;
    currentStock: number;
    minStock: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    items: number;
    totalValue: number;
  }>;
}

export interface BusinessIntelligenceData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    customerSatisfaction: number;
  };
  trends: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
  };
  forecasts: {
    nextMonthRevenue: number;
    seasonalTrends: Array<{
      season: string;
      expectedRevenue: number;
    }>;
  };
  topPerformers: Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

// Employee-related interfaces (extending from types/index.ts)
export interface EmployeeSearchParams {
  query?: string;
  department?: string;
  status?: 'Active' | 'Inactive';
  limit?: number;
  offset?: number;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  phone: string;
  hourlyRate: number;
  title: string;
  startDate: string;
  status?: string;
  bonus?: number;
}