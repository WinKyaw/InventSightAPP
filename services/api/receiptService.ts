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

export interface CreateReceiptRequest {
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
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
    const response = await apiClient.get<any>(url);

    // Handle both paginated and non-paginated responses
    if (response.content) {
      // Paginated response from backend
      return {
        receipts: response.content || [],
        totalCount: response.totalElements || 0,
        totalRevenue: response.content?.reduce((sum: number, r: Receipt) => sum + r.total, 0) || 0,
      };
    } else {
      // Non-paginated response (legacy support)
      return {
        receipts: response.receipts || response || [],
        totalCount: response.totalCount || response.receipts?.length || 0,
        totalRevenue: response.totalRevenue || 0,
      };
    }
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
    const response = await apiClient.get<any>(url);

    // Handle response structure
    const content = response.content || response.receipts || [];
    const totalElements = response.totalElements || response.totalCount || content.length;
    const totalPages = response.totalPages || Math.ceil(totalElements / size);
    const currentPage = response.number !== undefined ? response.number : page;

    return {
      content,
      totalElements,
      totalPages,
      currentPage,
      hasMore: currentPage < totalPages - 1,
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