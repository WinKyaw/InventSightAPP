// constants/types.ts

export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  barcode?: string;
  minStock?: number;
  salesCount: number;
  total: number;
  expanded: boolean;
  imageUrl?: string;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  category?: string;
  description?: string;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  dateTime: string;
  status: string;
  cashier?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  department?: string;
  startDate?: string;
  salary?: number;
  status: 'active' | 'inactive' | 'on_leave';
  avatar?: string;
  performanceScore?: number;
  totalSales?: number;
  ordersProcessed?: number;
  hoursWorked?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'meeting' | 'task' | 'reminder' | 'inventory' | 'payroll' | 'other';
  priority?: 'low' | 'medium' | 'high';
  completed?: boolean;
  reminder?: boolean;
  attendees?: string[];
  location?: string;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItems: number;
  lowStockItems: number;
  totalEmployees: number;
  activeEmployees: number;
  todayRevenue: number;
  todayOrders: number;
  monthlyTarget: number;
  monthlyProgress: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchParams {
  query?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  stockRange: {
    min: number;
    max: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  currency: string;
  dateFormat: string;
  notifications: {
    lowStock: boolean;
    newOrders: boolean;
    dailyReports: boolean;
    systemUpdates: boolean;
  };
  dashboard: {
    defaultView: string;
    refreshInterval: number;
    showCharts: boolean;
  };
}

export interface StockMovement {
  id: number;
  itemId: number;
  itemName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  date: string;
  user: string;
  notes?: string;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  categories: string[];
  lastOrderDate?: string;
  totalOrders?: number;
  averageDeliveryTime?: number;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  items: {
    itemId: number;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
  notes?: string;
}

export type TabType = 'create' | 'list';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type FilterType = 'all' | 'category' | 'price' | 'stock' | 'date';

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Navigation types
export interface NavigationState {
  currentScreen: string;
  previousScreen?: string;
  params?: Record<string, any>;
}

export interface ScreenProps {
  navigation?: any;
  route?: any;
}