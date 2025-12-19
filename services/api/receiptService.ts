import { Receipt, ReceiptItem } from '../../types';
import { apiClient } from './apiClient';

// Receipt API endpoints (extending the config)
const RECEIPT_ENDPOINTS = {
  CREATE: '/api/receipts',
  GET_ALL: '/api/receipts',
  GET_BY_ID: (id: string | number) => `/api/receipts/${id}`,
  UPDATE: (id: string | number) => `/api/receipts/${id}`,
  DELETE: (id: string | number) => `/api/receipts/${id}`,
  GET_BY_DATE: '/api/receipts/by-date',
};

// ✅ Backend expects simplified item format with productId and quantity only
export interface CreateReceiptItem {
  productId: string;  // Product ID as string (backend requirement)
  quantity: number;   // Quantity must be >= 1
}

// ✅ Updated to match backend API expectations
export interface CreateReceiptRequest {
  items: CreateReceiptItem[];  // Required: Array of items to purchase
  paymentMethod: string;        // Required: Payment method (e.g., 'CASH', 'CARD', 'MOBILE', 'OTHER')
  customerName?: string;        // Optional: Customer name (omit for walk-in customers)
  storeId?: string;             // Optional: Store ID (backend may require this or derive from user context)
}

// Legacy interface for local storage (includes calculated fields)
export interface LocalReceiptData {
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export interface ReceiptResponse {
  receipts: Receipt[];
  totalCount: number;
  totalRevenue: number;
}

export interface PaginatedReceiptResponse {
  content: Receipt[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

// Backend response types
interface BackendPaginatedResponse {
  content: Receipt[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface BackendLegacyResponse {
  receipts: Receipt[];
  totalCount: number;
  totalRevenue: number;
}

type BackendReceiptResponse = BackendPaginatedResponse | BackendLegacyResponse | Receipt[];

/**
 * Receipt API Client - Simple HTTP client for receipt operations
 */
export class ReceiptService {
  /**
   * Create a new receipt/transaction
   */
  static async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
    return await apiClient.post<Receipt>(RECEIPT_ENDPOINTS.CREATE, receiptData);
  }

  /**
   * Get all receipts with pagination
   */
  static async getAllReceipts(page = 0, size = 20): Promise<ReceiptResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sort', 'createdAt,desc');

    const url = `${RECEIPT_ENDPOINTS.GET_ALL}?${params.toString()}`;
    const response = await apiClient.get<BackendReceiptResponse>(url);

    // Handle paginated response
    if ('content' in response && Array.isArray(response.content)) {
      return {
        receipts: response.content,
        totalCount: response.totalElements || 0,
        totalRevenue: response.content.reduce((sum: number, r: Receipt) => sum + (r.totalAmount || r.total || 0), 0),
      };
    }
    
    // Handle legacy response
    if ('receipts' in response && Array.isArray(response.receipts)) {
      return {
        receipts: response.receipts,
        totalCount: response.totalCount || response.receipts.length,
        totalRevenue: response.totalRevenue || 0,
      };
    }
    
    // Handle array response
    if (Array.isArray(response)) {
      return {
        receipts: response,
        totalCount: response.length,
        totalRevenue: response.reduce((sum: number, r: Receipt) => sum + (r.totalAmount || r.total || 0), 0),
      };
    }

    // Fallback for unexpected response
    return {
      receipts: [],
      totalCount: 0,
      totalRevenue: 0,
    };
  }

  /**
   * Get receipts with full pagination info
   */
  static async getReceiptsPaginated(page = 0, size = 20): Promise<PaginatedReceiptResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sort', 'createdAt,desc');

    const url = `${RECEIPT_ENDPOINTS.GET_ALL}?${params.toString()}`;
    const response = await apiClient.get<BackendReceiptResponse>(url);

    // Handle paginated response
    if ('content' in response && Array.isArray(response.content)) {
      const totalElements = response.totalElements || response.content.length;
      const totalPages = response.totalPages || Math.ceil(totalElements / size);
      const currentPage = response.number !== undefined ? response.number : page;

      return {
        content: response.content,
        totalElements,
        totalPages,
        currentPage,
        hasMore: currentPage < totalPages - 1,
      };
    }

    // Handle legacy response
    if ('receipts' in response && Array.isArray(response.receipts)) {
      const totalElements = response.totalCount || response.receipts.length;
      const totalPages = Math.ceil(totalElements / size);

      return {
        content: response.receipts,
        totalElements,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages - 1,
      };
    }

    // Handle array response
    if (Array.isArray(response)) {
      const totalPages = Math.ceil(response.length / size);

      return {
        content: response,
        totalElements: response.length,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages - 1,
      };
    }

    // Fallback for unexpected response
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      hasMore: false,
    };
  }

  /**
   * Get receipt by ID
   */
  static async getReceiptById(id: string | number): Promise<Receipt> {
    return await apiClient.get<Receipt>(RECEIPT_ENDPOINTS.GET_BY_ID(id));
  }

  /**
   * Get receipts by date range
   */
  static async getReceiptsByDate(startDate: string, endDate?: string): Promise<Receipt[]> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `${RECEIPT_ENDPOINTS.GET_BY_DATE}?${params.toString()}`;
    return await apiClient.get<Receipt[]>(url);
  }

  /**
   * Get receipts by employee and date
   * @param employeeId - The ID of the employee
   * @param date - The date in YYYY-MM-DD format
   */
  static async getReceiptsByEmployeeAndDate(
    employeeId: string,
    date: string
  ): Promise<Receipt[]> {
    const params = new URLSearchParams();
    params.append('date', date);

    const url = `/api/receipts/employee/${employeeId}?${params.toString()}`;
    return await apiClient.get<Receipt[]>(url);
  }

  /**
   * Update an existing receipt
   */
  static async updateReceipt(id: string | number, receiptData: Partial<CreateReceiptRequest>): Promise<Receipt> {
    return await apiClient.put<Receipt>(RECEIPT_ENDPOINTS.UPDATE(id), receiptData);
  }

  /**
   * Delete a receipt
   */
  static async deleteReceipt(id: string | number): Promise<void> {
    await apiClient.delete<void>(RECEIPT_ENDPOINTS.DELETE(id));
  }
}

export default ReceiptService;