/**
 * API Configuration
 * Central configuration file for all API endpoints and types
 */

import { getApiBaseUrl } from '../../utils/networkConfig';
import { AxiosError } from 'axios';

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),  // Uses platform-specific URL detection
  TIMEOUT: 30000, // 30 seconds
  USER_LOGIN: 'WinKyaw',
};

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Customer endpoints
  CUSTOMERS: {
    ALL: '/api/customers',
    BY_ID: (id: string | number) => `/api/customers/${id}`,
    CREATE: '/api/customers',
    UPDATE: (id: string | number) => `/api/customers/${id}`,
    DELETE: (id: string | number) => `/api/customers/${id}`,
    SEARCH: '/api/customers/search',
  },

  // Product endpoints
  PRODUCTS: {
    ALL: '/api/products',
    BY_ID: (id: string | number) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string | number) => `/api/products/${id}`,
    DELETE: (id: string | number) => `/api/products/${id}`,
    COUNT: '/api/products/count',
    SEARCH: '/api/products/search',
    SEARCH_FOR_TRANSFER: '/api/products/search-for-transfer',
    LOW_STOCK: '/api/products/low-stock',
    UPDATE_STOCK: (id: string | number) => `/api/products/${id}/stock`,
    BY_CATEGORY: (categoryId: string | number) => `/api/products/category/${categoryId}`,
  },

  // Employee endpoints
  EMPLOYEES: {
    ALL: '/api/employees',
    BY_ID: (id: string | number) => `/api/employees/${id}`,
    CREATE: '/api/employees',
    UPDATE: (id: string | number) => `/api/employees/${id}`,
    DELETE: (id: string | number) => `/api/employees/${id}`,
    SEARCH: '/api/employees/search',
    CHECKED_IN: '/api/employees/checked-in',
    ROLES: '/api/employees/roles',
    PERMISSIONS: '/api/employees/permissions',
  },

  // Receipt endpoints
  RECEIPTS: {
    ALL: '/api/receipts',
    BY_ID: (id: string | number) => `/api/receipts/${id}`,
    CREATE: '/api/receipts',
    UPDATE: (id: string | number) => `/api/receipts/${id}`,
    DELETE: (id: string | number) => `/api/receipts/${id}`,
    SEARCH: '/api/receipts/search',
    BY_DATE: '/api/receipts/by-date',
    RECENT: '/api/receipts/recent',
    STATISTICS: '/api/receipts/statistics',
    CASHIERS: '/api/receipts/cashiers',
  },

  // Calendar endpoints
  CALENDAR: {
    EVENTS: '/api/calendar/events',
    BY_ID: (id: string | number) => `/api/calendar/events/${id}`,
    CREATE: '/api/calendar/events',
    UPDATE: (id: string | number) => `/api/calendar/events/${id}`,
    DELETE: (id: string | number) => `/api/calendar/events/${id}`,
    DAILY_ACTIVITIES: '/api/calendar/daily-activities',
    REMINDERS: '/api/calendar/reminders',
    ACTIVITIES_BY_DATE: '/api/calendar/activities-by-date',
  },

  // Dashboard endpoints
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
    ANALYTICS: '/api/dashboard/analytics',
    STATS: '/api/dashboard/stats',
  },

  // Report endpoints
  REPORTS: {
    DAILY: '/api/reports/daily',
    WEEKLY: '/api/reports/weekly',
    INVENTORY: '/api/reports/inventory',
    BUSINESS_INTELLIGENCE: '/api/reports/business-intelligence',
  },

  // Items/Inventory endpoints (legacy)
  ITEMS: {
    ALL: '/api/items',
    BY_ID: (id: string | number) => `/api/items/${id}`,
    CREATE: '/api/items',
    UPDATE: (id: string | number) => `/api/items/${id}`,
    DELETE: (id: string | number) => `/api/items/${id}`,
  },

  // Store endpoints
  STORES: {
    ALL: '/api/stores',
    BY_ID: (id: string | number) => `/api/stores/${id}`,
    CREATE: '/api/stores',
    UPDATE: (id: string | number) => `/api/stores/${id}`,
    DELETE: (id: string | number) => `/api/stores/${id}`,
    ACTIVATE: (id: string | number) => `/api/stores/${id}/activate`,
  },

  // Warehouse endpoints
  WAREHOUSES: {
    ALL: '/api/warehouses',
    BY_ID: (id: string | number) => `/api/warehouses/${id}`,
    CREATE: '/api/warehouses',
    UPDATE: (id: string | number) => `/api/warehouses/${id}`,
    DELETE: (id: string | number) => `/api/warehouses/${id}`,
    INVENTORY: '/api/warehouse-inventory',
    ADD_INVENTORY: '/api/warehouse-inventory/add',
    WITHDRAW_INVENTORY: '/api/warehouse-inventory/withdraw',
  },

  // Merchant endpoints
  MERCHANTS: {
    ALL: '/api/merchants',
    BY_ID: (id: string | number) => `/api/merchants/${id}`,
    CREATE: '/api/merchants',
    UPDATE: (id: string | number) => `/api/merchants/${id}`,
    DELETE: (id: string | number) => `/api/merchants/${id}`,
  },

  // Company endpoints
  COMPANIES: {
    ALL: '/api/companies',
    BY_ID: (id: string | number) => `/api/companies/${id}`,
    CREATE: '/api/companies',
    UPDATE: (id: string | number) => `/api/companies/${id}`,
    DELETE: (id: string | number) => `/api/companies/${id}`,
  },

  // Transfer Request endpoints
  TRANSFER_REQUESTS: {
    ALL: '/api/transfers',
    BY_ID: (id: string) => `/api/transfers/${id}`,
    CREATE: '/api/transfers/request',
    APPROVE: (id: string) => `/api/transfers/${id}/approve`,
    REJECT: (id: string) => `/api/transfers/${id}/reject`,
    SEND: (id: string) => `/api/transfers/${id}/send`,
    CONFIRM_RECEIPT: (id: string) => `/api/transfers/${id}/receive`,
    CANCEL: (id: string) => `/api/transfers/${id}/cancel`,
    HISTORY: '/api/transfers/history',
    COMPLETE: (id: string) => `/api/transfers/${id}/complete`,
  },

  // Marketplace endpoints
  MARKETPLACE: {
    ADS: '/api/marketplace/ads',
    ORDERS: '/api/marketplace/orders',
  },

  // Supply Management endpoints
  SUPPLY_MANAGEMENT: {
    PERMISSIONS: '/api/supply-management/permissions',
  },

  // Internationalization endpoints
  I18N: {
    TRANSLATIONS: '/api/i18n/translations',
  },

  // User endpoints
  USER: {
    NAVIGATION_PREFERENCES: '/api/user/navigation-preferences',
  },

  // Category endpoints
  CATEGORIES: {
    ALL: '/api/categories',
    BY_ID: (id: string | number) => `/api/categories/${id}`,
    CREATE: '/api/categories',
    UPDATE: (id: string | number) => `/api/categories/${id}`,
    DELETE: (id: string | number) => `/api/categories/${id}`,
    COUNT: '/api/categories/count',
  },

  // Activity endpoints
  ACTIVITIES: {
    ALL: '/api/activities',
    RECENT: '/api/activities/recent',
    BY_ID: (id: string | number) => `/api/activities/${id}`,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get session information for API requests
 */
export const getSessionInfo = () => ({
  userLogin: API_CONFIG.USER_LOGIN,
  timestamp: new Date().toISOString(),
});

/**
 * Get network diagnostic information for troubleshooting
 */
export const getNetworkDiagnostics = (error?: AxiosError | any) => {
  const diagnostics = {
    issue: 'Network connectivity problem',
    message: 'Unable to connect to the server',
    suggestions: [] as string[],
  };

  if (error?.code === 'ECONNREFUSED') {
    diagnostics.issue = 'Connection refused';
    diagnostics.message = 'The server refused the connection';
    diagnostics.suggestions = [
      'Verify the backend server is running',
      'Check if the server is listening on the correct port (8080)',
      'Ensure no firewall is blocking the connection',
    ];
  } else if (error?.code === 'ENOTFOUND') {
    diagnostics.issue = 'Host not found';
    diagnostics.message = 'Unable to resolve the server hostname';
    diagnostics.suggestions = [
      'Check your internet connection',
      'Verify the API_BASE_URL is correct',
      'Try restarting your network connection',
    ];
  } else if (error?.code === 'ETIMEDOUT') {
    diagnostics.issue = 'Connection timeout';
    diagnostics.message = 'The server took too long to respond';
    diagnostics.suggestions = [
      'Check your internet connection speed',
      'Verify the server is responsive',
      'Try again in a few moments',
    ];
  } else if (error?.message?.includes('Network Error')) {
    diagnostics.suggestions = [
      'Check your internet connection',
      'Verify the backend server is accessible',
      'Check the API_BASE_URL configuration',
      'Ensure the server is running on the expected network',
    ];
  } else {
    diagnostics.suggestions = [
      'Check your network connection',
      'Verify the server is running',
      'Check server logs for errors',
      'Try restarting the app',
    ];
  }

  return diagnostics;
};

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

/**
 * Activity Item
 */
export interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  details?: any;
  // Additional fields used in dashboard
  productName?: string;
  quantity?: number;
  totalValue?: number;
}

/**
 * Recent Activities Response
 */
export interface RecentActivitiesResponse {
  activities: ActivityItem[];
  total: number;
}

/**
 * Daily Report Data
 */
export interface DailyReportData {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    revenue: number;
    orders: number;
  }>;
}

/**
 * Weekly Report Data
 */
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
  topPerformers: Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
  }>;
}

/**
 * Inventory Report Data
 */
export interface InventoryReportData {
  totalProducts: number;
  totalValue: number;
  lowStockItems: LowStockProduct[];
  categoryBreakdown: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

/**
 * Business Intelligence Data
 */
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
  topPerformers: Array<{
    name: string;
    category: string;
    sales: number;
    quantity: number;
    trend: number;
  }>;
  insights: string[];
}

/**
 * Dashboard Summary
 */
export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  inventoryValue: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerSatisfaction: number;
  lowStockCount: number;
  recentActivities: ActivityItem[];
}

/**
 * Low Stock Product
 */
export interface LowStockProduct {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category?: string;
  sku?: string;
}

/**
 * Product Interfaces
 */
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCountResponse {
  totalProducts: number;
}

export interface LowStockResponse {
  products: LowStockProduct[];
  count: number;
}

export interface ProductsListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
  sku?: string;
  barcode?: string;
  minStock?: number;
  maxStock?: number;
}

export interface UpdateStockRequest {
  quantity: number;
  reason?: string;
}

export interface SearchProductsParams {
  query?: string;
  category?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  storeId?: string;        // Filter by store
  warehouseId?: string;    // Filter by warehouse
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
}

/**
 * Employee Interfaces
 */
export interface EmployeeSearchParams {
  query?: string;
  department?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  hourlyRate?: number;
  startDate?: string;
  status?: string;
}

/**
 * Category Interfaces
 */
export interface CategoryCountResponse {
  totalCategories: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
}

/**
 * Transfer-specific product search parameters
 */
export interface SearchProductsForTransferParams {
  query?: string;
  fromStoreId?: string;
  fromWarehouseId?: string;
  fromCompanyId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Product with transfer availability info
 */
export interface ProductForTransfer {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reserved: number;
  inTransit: number;
  availableForTransfer: number;
  location: {
    id: string;
    type: 'STORE' | 'WAREHOUSE';
    name: string;
    companyId: string;
  };
}

/**
 * Transfer search response
 */
export interface TransferProductSearchResponse {
  products: ProductForTransfer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    query: string;
    fromLocationId: string;
    fromLocationType: 'STORE' | 'WAREHOUSE';
    fromCompanyId: string;
  };
}