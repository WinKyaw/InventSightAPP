import { Receipt, ReceiptItem } from '../../types';
import { apiClient } from './apiClient';

// Receipt API endpoints (extending the config)
const RECEIPT_ENDPOINTS = {
  CREATE: '/api/receipts',
  GET_ALL: '/api/receipts',
  GET_BY_ID: (id: string | number) => `/api/receipts/${id}`,
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
   * Get all receipts
   */
  static async getAllReceipts(limit?: number, offset?: number): Promise<ReceiptResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${RECEIPT_ENDPOINTS.GET_ALL}?${queryString}` : RECEIPT_ENDPOINTS.GET_ALL;

    return await apiClient.get<ReceiptResponse>(url);
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
}

export default ReceiptService;