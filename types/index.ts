export interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  expanded: boolean;
  category: string;
  salesCount: number;
  description?: string;
  sku?: string;
  minStock?: number;
  maxStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  checkInTime: string;
  hourlyRate: number;
  phone: string;
  totalCompensation: number;
  startDate: string;
  status: string;
  title: string;
  bonus: number;
  expanded: boolean;
  // Additional fields for API integration
  userId?: string;
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department?: string;
  hireDate?: string;
  profile?: UserProfile;
}

export interface Reminder {
  id: number;
  title: string;
  date: string;
  type: 'order' | 'meeting' | 'maintenance';
  time: string;
  description: string;
}

// New Event interface for Calendar API integration
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  attendees?: Employee[];
  createdBy: string;
  type?: 'order' | 'meeting' | 'maintenance';
  time?: string;
}

export interface ReceiptItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  dateTime: string;
  status: string;
  // Additional fields for API integration
  userId?: string;
  vendor?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

// New UserProfile interface for Profile API integration
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  avatarUrl?: string;
  role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

// New UserSettings interface for Profile API integration
export interface UserSettings {
  id: string;
  userId: string;
  notifications: boolean;
  darkMode: boolean;
  language: string;
  currency: string;
  timezone: string;
}

// API Request/Response types
export interface CreateReceiptRequest {
  customerName?: string;
  vendor: string;
  items: {
    itemId: number;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface UpdateReceiptRequest {
  customerName?: string;
  vendor?: string;
  items?: {
    itemId: number;
    quantity: number;
    price: number;
  }[];
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  attendeeIds?: string[];
  type?: 'order' | 'meeting' | 'maintenance';
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  attendeeIds?: string[];
  type?: 'order' | 'meeting' | 'maintenance';
}

export interface ReceiptSearchParams {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
  vendor?: string;
  page?: number;
  limit?: number;
}

export interface EventSearchParams {
  query?: string;
  year?: number;
  month?: number;
  dateFrom?: string;
  dateTo?: string;
  type?: 'order' | 'meeting' | 'maintenance';
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  department?: string;
}

export interface UpdateUserSettingsRequest {
  notifications?: boolean;
  darkMode?: boolean;
  language?: string;
  currency?: string;
  timezone?: string;
}