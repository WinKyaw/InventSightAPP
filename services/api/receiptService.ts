import { Receipt, ReceiptItem } from '../../types';
import { post, get } from './httpClient';
import { API_CONFIG } from './config';

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

export class ReceiptService {
  /**
   * Create a new receipt/transaction
   */
  static async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
    try {
      const newReceiptData = {
        ...receiptData,
        receiptNumber: this.generateReceiptNumber(),
        dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'completed',
      };

      const response = await post<Receipt>(RECEIPT_ENDPOINTS.CREATE, newReceiptData);
      return response.data;
    } catch (error) {
      console.error('Failed to create receipt:', error);
      throw error;
    }
  }

  /**
   * Get all receipts
   */
  static async getAllReceipts(limit?: number, offset?: number): Promise<ReceiptResponse> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());

      const queryString = params.toString();
      const url = queryString ? `${RECEIPT_ENDPOINTS.GET_ALL}?${queryString}` : RECEIPT_ENDPOINTS.GET_ALL;

      const response = await get<ReceiptResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      throw error;
    }
  }

  /**
   * Get receipt by ID
   */
  static async getReceiptById(id: string | number): Promise<Receipt> {
    try {
      const response = await get<Receipt>(RECEIPT_ENDPOINTS.GET_BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get receipts by date range
   */
  static async getReceiptsByDate(startDate: string, endDate?: string): Promise<Receipt[]> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${RECEIPT_ENDPOINTS.GET_BY_DATE}?${params.toString()}`;
      const response = await get<Receipt[]>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch receipts by date:', error);
      throw error;
    }
  }

  /**
   * Generate receipt number
   */
  private static generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = date.getTime().toString().slice(-4);
    return `RCP-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Calculate receipt totals (utility function)
   */
  static calculateReceiptTotals(items: ReceiptItem[], taxRate: number = 0.08): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}

export default ReceiptService;