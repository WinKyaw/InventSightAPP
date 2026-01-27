import { Employee } from '../../types';
import { getApiBaseUrl, getNetworkInfo } from '../../utils/networkConfig';

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(8080, 'http'),
  TIMEOUT: parseInt(process.env.API_TIMEOUT || '30000'), // Increased from 10s to 30s
  USER_LOGIN: process.env.USER_LOGIN || 'WinKyaw',
};

// Network Configuration
export const NETWORK_CONFIG = {
  // Backend API base URL
  // IMPORTANT: Update this with your backend server IP
  API_BASE_URL: API_CONFIG.BASE_URL,
  
  // Timeout configuration
  TIMEOUT: API_CONFIG.TIMEOUT,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second between retries
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
    DAILY: '/api/reports/daily',
    WEEKLY: '/api/reports/weekly', 
    INVENTORY: '/api/reports/inventory',
    BUSINESS_INTELLIGENCE: '/api/reports/business-intelligence',
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
    ALL: '/api/employees',
    BY_ID: (id: string | number) => `/api/employees/${id}`,
    CHECKED_IN: '/api/employees/checked-in',
    SEARCH: '/api/employees/search',
    CREATE: '/api/employees',
  },
  // Store endpoints
  STORES: {
    ALL: '/api/stores',
    BY_ID: (id: string) => `/api/stores/${id}`,
    CREATE: '/api/stores',
    ACTIVATE: (id: string) => `/api/stores/${id}/activate`,
    CURRENT: '/api/stores/current',
  },
  // User/Navigation endpoints
  USER: {
    NAVIGATION_PREFERENCES: '/api/user/navigation-preferences',
  },
  // Supply Management endpoints
  SUPPLY_MANAGEMENT: {
    CHECK: '/api/supply-management/check',
    PERMISSIONS: '/api/supply-management/permissions',
  },
  // Transfer Request endpoints
  TRANSFER_REQUESTS: {
    ALL: '/api/transfer-requests',
    BY_ID: (id: string) => `/api/transfer-requests/${id}`,
    CREATE: '/api/transfer-requests',
    APPROVE: (id: string) => `/api/transfer-requests/${id}/approve`,
    REJECT: (id: string) => `/api/transfer-requests/${id}/reject`,
    SEND: (id: string) => `/api/transfer-requests/${id}/send`,
    CONFIRM_RECEIPT: (id: string) => `/api/transfer-requests/${id}/receive`,
    CANCEL: (id: string) => `/api/transfer-requests/${id}/cancel`,
    HISTORY: '/api/transfer-requests/history',
    SUMMARY: '/api/transfer-requests/summary',
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
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  totalItems: number;
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
  storeId?: string;  // ✅ FIX: Add storeId parameter
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
  storeId: string; // UUID required by backend
}

// Default store ID for fallback when no store is selected
export const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000000';

// Helper to detect common network issues
export const getNetworkDiagnostics = (error: any) => {
  if (error.code === 'ECONNABORTED') {
    return {
      issue: 'timeout',
      message: 'Connection timeout. Your backend might not be running or is taking too long to respond.',
      suggestions: [
        '✓ Check if InventSight backend is running on port 8080',
        '✓ Verify inventsight.security.local-login.enabled=true in backend config',
        '✓ Check your network connection',
        '✓ Verify the backend IP address is correct: ' + NETWORK_CONFIG.API_BASE_URL,
        '✓ See BACKEND_SETUP.md for detailed setup instructions'
      ]
    };
  }
  
  if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
    return {
      issue: 'connection_refused',
      message: 'Cannot connect to backend server.',
      suggestions: [
        '✓ Ensure InventSight backend is running',
        '✓ Verify backend IP address: Currently set to ' + NETWORK_CONFIG.API_BASE_URL,
        '✓ Check if local-login is enabled in backend application.yml',
        '✓ Verify you are on the same WiFi network as the backend',
        '✓ Check firewall allows connections on port 8080'
      ]
    };
  }
  
  if (error.response?.status === 404) {
    return {
      issue: 'endpoint_not_found',
      message: 'Login endpoint not found. The backend AuthController may be disabled.',
      suggestions: [
        '⚠️  CRITICAL: Backend AuthController is likely DISABLED',
        '✓ Edit backend application.yml and add:',
        '   inventsight:',
        '     security:',
        '       local-login:',
        '         enabled: true',
        '✓ Restart backend server',
        '✓ See BACKEND_SETUP.md for complete instructions'
      ]
    };
  }
  
  return {
    issue: 'unknown',
    message: error.message || 'Unknown network error',
    suggestions: [
      '✓ Check backend logs for more details',
      '✓ Verify backend configuration',
      '✓ See BACKEND_SETUP.md and NETWORK_TROUBLESHOOTING.md'
    ]
  };
};