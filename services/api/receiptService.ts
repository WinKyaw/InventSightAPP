import { Receipt, CreateReceiptRequest, UpdateReceiptRequest, ReceiptSearchParams } from '../../types';
import { get, post, put, del } from './httpClient';
import { API_ENDPOINTS, ApiResponse } from './config';

export class ReceiptService {
  /**
   * Get all receipts for authenticated user
   */
  static async getAllReceipts(page: number = 1, limit: number = 20): Promise<Receipt[]> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      const response = await get<Receipt[]>(`${API_ENDPOINTS.RECEIPTS.ALL}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      throw error;
    }
  }

  /**
   * Get specific receipt by ID
   */
  static async getReceiptById(id: string | number): Promise<Receipt> {
    try {
      const response = await get<Receipt>(API_ENDPOINTS.RECEIPTS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new receipt
   */
  static async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
    try {
      const response = await post<Receipt>(API_ENDPOINTS.RECEIPTS.CREATE, receiptData);
      return response.data;
    } catch (error) {
      console.error('Failed to create receipt:', error);
      throw error;
    }
  }

  /**
   * Update existing receipt
   */
  static async updateReceipt(id: string | number, receiptData: UpdateReceiptRequest): Promise<Receipt> {
    try {
      const response = await put<Receipt>(API_ENDPOINTS.RECEIPTS.UPDATE(id), receiptData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete receipt
   */
  static async deleteReceipt(id: string | number): Promise<boolean> {
    try {
      await del(API_ENDPOINTS.RECEIPTS.DELETE(id));
      return true;
    } catch (error) {
      console.error(`Failed to delete receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add items to receipt
   */
  static async addItemsToReceipt(receiptId: string | number, items: { itemId: number; quantity: number; price: number; }[]): Promise<Receipt> {
    try {
      const response = await post<Receipt>(API_ENDPOINTS.RECEIPTS.ADD_ITEMS(receiptId), { items });
      return response.data;
    } catch (error) {
      console.error(`Failed to add items to receipt ${receiptId}:`, error);
      throw error;
    }
  }

  /**
   * Search receipts with filters
   */
  static async searchReceipts(searchParams: ReceiptSearchParams): Promise<Receipt[]> {
    try {
      const params = new URLSearchParams();
      
      if (searchParams.query) params.append('query', searchParams.query);
      if (searchParams.dateFrom) params.append('dateFrom', searchParams.dateFrom);
      if (searchParams.dateTo) params.append('dateTo', searchParams.dateTo);
      if (searchParams.minTotal) params.append('minTotal', searchParams.minTotal.toString());
      if (searchParams.maxTotal) params.append('maxTotal', searchParams.maxTotal.toString());
      if (searchParams.vendor) params.append('vendor', searchParams.vendor);
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());

      const response = await get<Receipt[]>(`${API_ENDPOINTS.RECEIPTS.SEARCH}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search receipts:', error);
      throw error;
    }
  }
}