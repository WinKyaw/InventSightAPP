import { Employee } from '../../types';
import { getApiBaseUrl, getNetworkInfo } from '../../utils/networkConfig';

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(8080, 'http'),
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '10000'),
  USER_LOGIN: process.env.USER_LOGIN || 'WinKyaw',
};

// Log network configuration in development for debugging
if (__DEV__) {
  console.log('🌐 InventSightAPP Network Configuration:');
  console.log(`📡 API Base URL: ${API_CONFIG.BASE_URL}`);
  const networkInfo = getNetworkInfo();
  console.log('📱 Platform Details:', {
    platform: networkInfo.platform,
    isDevice: networkInfo.isDevice,
    detectedUrl: networkInfo.detectedBaseUrl,
    envOverride: networkInfo.environmentBaseUrl || 'None',
  });
  console.log('💡 If you see network errors, check the README for platform-specific URLs');
}

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
  },
  // Reports endpoints
  REPORTS: {
    DAILY: '/reports/daily',
    WEEKLY: '/reports/weekly', 
    INVENTORY: '/reports/inventory',
    BUSINESS_INTELLIGENCE: '/reports/business-intelligence',
  },
  // Product endpoints
  PRODUCTS: {
    ALL: '/api/products',
    COUNT: '/api/products/count',
    LOW_STOCK: '/api/products/low-stock',
    BY_ID: (id: string | number) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string | number) => `/api/products/${id}`,
    DELETE: (id: string | number) => `/api/products/${id}`,
    SEARCH: '/api/products/search',
    BY_CATEGORY: (categoryId: string | number) => `/api/products/category/${categoryId}`,
    UPDATE_STOCK: (id: string | number) => `/api/products/${id}/stock`,
  },
  // Category endpoints
  CATEGORIES: {
    ALL: '/api/categories',
    COUNT: '/api/categories/count',
    BY_ID: (id: string | number) => `/api/categories/${id}`,
    CREATE: '/api/categories',
    UPDATE: (id: string | number) => `/api/categories/${id}`,
    DELETE: (id: string | number) => `/api/categories/${id}`,
  },
  // Activity endpoints
  ACTIVITIES: {
    ALL: '/api/activities',
    RECENT: '/api/activities/recent',
    BY_ID: (id: string | number) => `/api/activities/${id}`,
  },
  // Dashboard endpoints
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
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

// New API interfaces for dashboard integration
export interface ProductCountResponse {
  totalProducts: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  reorderLevel: number;
}

export interface LowStockResponse {
  lowStockItems: LowStockProduct[];
  count: number;
}

export interface CategoryCountResponse {
  totalCategories: number;
}

export interface ActivityItem {
  id: number;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  productName: string;
  quantity: number;
  timestamp: string;
  userId?: string;
  notes?: string;
  // Enhanced fields for better data display
  unitPrice?: number;
  totalValue?: number;
  productId?: number;
}

export interface RecentActivitiesResponse {
  activities: ActivityItem[];
  count: number;
}

export interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  totalCategories: number;
  recentActivities: ActivityItem[];
  inventoryValue: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  lastUpdated: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

// Product API interfaces
export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  sku?: string;
  minStock?: number;
  maxStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  sku?: string;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  description?: string;
  sku?: string;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateStockRequest {
  quantity: number;
  operation: 'SET' | 'ADD' | 'SUBTRACT';
  reason?: string;
}

export interface ProductsListResponse {
  products: Product[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchProductsParams {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'quantity' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchResponse {
  products: Product[];
  totalCount: number;
  searchQuery?: string;
  appliedFilters?: SearchProductsParams;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
  totalCount: number;
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