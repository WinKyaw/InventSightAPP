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
    UPDATE: (id: string | number) => `/employees/${id}`,
    DELETE: (id: string | number) => `/employees/${id}`,
  },
  // Receipt endpoints
  RECEIPTS: {
    ALL: '/api/receipts',
    BY_ID: (id: string | number) => `/api/receipts/${id}`,
    CREATE: '/api/receipts',
    UPDATE: (id: string | number) => `/api/receipts/${id}`,
    DELETE: (id: string | number) => `/api/receipts/${id}`,
    SEARCH: '/api/receipts/search',
    BY_DATE_RANGE: '/api/receipts/by-date-range',
  },
  // Calendar/Events endpoints
  CALENDAR: {
    EVENTS: '/api/calendar/events',
    REMINDERS: '/api/calendar/reminders',
    BY_ID: (id: string | number) => `/api/calendar/events/${id}`,
    REMINDER_BY_ID: (id: string | number) => `/api/calendar/reminders/${id}`,
    CREATE_EVENT: '/api/calendar/events',
    CREATE_REMINDER: '/api/calendar/reminders',
    UPDATE_EVENT: (id: string | number) => `/api/calendar/events/${id}`,
    UPDATE_REMINDER: (id: string | number) => `/api/calendar/reminders/${id}`,
    DELETE_EVENT: (id: string | number) => `/api/calendar/events/${id}`,
    DELETE_REMINDER: (id: string | number) => `/api/calendar/reminders/${id}`,
    BY_DATE_RANGE: '/api/calendar/events/by-date-range',
    ACTIVITIES: '/api/calendar/activities',
    DAILY_SUMMARY: (date: string) => `/api/calendar/daily-summary/${date}`,
  },
  // Profile endpoints
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
    CHANGE_PASSWORD: '/api/profile/change-password',
    UPLOAD_AVATAR: '/api/profile/avatar',
    DELETE_AVATAR: '/api/profile/avatar',
    SETTINGS: '/api/profile/settings',
    UPDATE_SETTINGS: '/api/profile/settings',
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

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  hourlyRate?: number;
  title?: string;
  startDate?: string;
  status?: string;
  bonus?: number;
  checkInTime?: string;
}

// Receipt API interfaces
export interface CreateReceiptRequest {
  customerName: string;
  items: ReceiptItemRequest[];
  subtotal: number;
  tax: number;
  total: number;
  dateTime: string;
}

export interface ReceiptItemRequest {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface UpdateReceiptRequest {
  customerName?: string;
  status?: string;
}

export interface ReceiptSearchParams {
  customerName?: string;
  receiptNumber?: string;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'receiptNumber' | 'customerName' | 'total' | 'dateTime';
  sortOrder?: 'asc' | 'desc';
}

export interface ReceiptsListResponse {
  receipts: any[]; // Will use Receipt from types/index.ts
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Calendar/Events API interfaces
export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'order' | 'maintenance' | 'reminder';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  attendees?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'order' | 'maintenance' | 'reminder';
  location?: string;
  attendees?: string[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type?: 'meeting' | 'order' | 'maintenance' | 'reminder';
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  attendees?: string[];
}

export interface DailyActivity {
  date: string;
  sales: number;
  orders: number;
  customers: number;
  events: CalendarEvent[];
  activities: ActivitySummary[];
  topItems: TopItemSummary[];
}

export interface ActivitySummary {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  amount?: number;
  icon?: string; // Add this for compatibility with existing UI
  time?: string; // Add this for compatibility with existing UI
}

export interface TopItemSummary {
  name: string;
  quantity: number;
  revenue: number;
  sales: number; // Add this for compatibility with existing UI
}

export interface EventsListResponse {
  events: CalendarEvent[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface DateRangeParams {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}

// Profile API interfaces
export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  avatar?: string;
  settings: ProfileSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSettings {
  language: string;
  timezone: string;
  currency: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  lowStock: boolean;
  orderUpdates: boolean;
  reminders: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateSettingsRequest {
  language?: string;
  timezone?: string;
  currency?: string;
  notifications?: Partial<NotificationSettings>;
  theme?: 'light' | 'dark' | 'auto';
}