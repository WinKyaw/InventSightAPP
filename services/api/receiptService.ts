import { Receipt } from '../../types';
import { get, post, put, del } from './httpClient';
import { 
  API_ENDPOINTS, 
  CreateReceiptRequest, 
  UpdateReceiptRequest, 
  ReceiptSearchParams, 
  ReceiptsListResponse,
  DateRangeParams,
  ApiResponse 
} from './config';

export class ReceiptService {
  /**
   * Get all receipts with pagination
   */
  static async getAllReceipts(page: number = 1, limit: number = 20): Promise<ReceiptsListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await get<ReceiptsListResponse>(`${API_ENDPOINTS.RECEIPTS.ALL}?${params}`);
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
      const response = await get<Receipt>(API_ENDPOINTS.RECEIPTS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new receipt
   */
  static async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
    try {
      // Generate receipt number on frontend as fallback
      const receiptNumber = `RCP-${Date.now()}`;
      const receiptWithNumber = {
        ...receiptData,
        receiptNumber,
        status: 'completed'
      };

      const response = await post<Receipt>(API_ENDPOINTS.RECEIPTS.CREATE, receiptWithNumber);
      return response.data;
    } catch (error) {
      console.error('Failed to create receipt:', error);
      throw error;
    }
  }

  /**
   * Update an existing receipt
   */
  static async updateReceipt(id: number, updates: UpdateReceiptRequest): Promise<Receipt> {
    try {
      const response = await put<Receipt>(API_ENDPOINTS.RECEIPTS.UPDATE(id), updates);
      return response.data;
    } catch (error) {
      console.error(`Failed to update receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a receipt
   */
  static async deleteReceipt(id: number): Promise<void> {
    try {
      await del(API_ENDPOINTS.RECEIPTS.DELETE(id));
    } catch (error) {
      console.error(`Failed to delete receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search receipts with filters
   */
  static async searchReceipts(params: ReceiptSearchParams): Promise<ReceiptsListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.customerName) searchParams.append('customerName', params.customerName);
      if (params.receiptNumber) searchParams.append('receiptNumber', params.receiptNumber);
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      if (params.minTotal) searchParams.append('minTotal', params.minTotal.toString());
      if (params.maxTotal) searchParams.append('maxTotal', params.maxTotal.toString());
      if (params.status) searchParams.append('status', params.status);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const queryString = searchParams.toString();
      const url = queryString ? `${API_ENDPOINTS.RECEIPTS.SEARCH}?${queryString}` : API_ENDPOINTS.RECEIPTS.SEARCH;
      
      const response = await get<ReceiptsListResponse>(url);
      return response.data;
    } catch (error) {
      console.error('Failed to search receipts:', error);
      throw error;
    }
  }

  /**
   * Get receipts by date range
   */
  static async getReceiptsByDateRange(params: DateRangeParams): Promise<ReceiptsListResponse> {
    try {
      const searchParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate
      });
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await get<ReceiptsListResponse>(`${API_ENDPOINTS.RECEIPTS.BY_DATE_RANGE}?${searchParams}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch receipts by date range:', error);
      throw error;
    }
  }

  /**
   * Get receipts count
   */
  static async getReceiptsCount(): Promise<number> {
    try {
      const response = await this.getAllReceipts(1, 1);
      return response.totalCount;
    } catch (error) {
      console.error('Failed to get receipts count:', error);
      return 0;
    }
  }

  /**
   * Get today's receipts
   */
  static async getTodaysReceipts(): Promise<Receipt[]> {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = startDate; // Same day

      const response = await this.getReceiptsByDateRange({
        startDate,
        endDate,
        limit: 100 // Get all today's receipts
      });

      return response.receipts as Receipt[];
    } catch (error) {
      console.error('Failed to fetch today\'s receipts:', error);
      return [];
    }
  }

  /**
   * Calculate total revenue for date range
   */
  static async getRevenueByDateRange(startDate: string, endDate: string): Promise<number> {
    try {
      const receiptsResponse = await this.getReceiptsByDateRange({
        startDate,
        endDate,
        limit: 1000 // Get enough receipts to calculate revenue
      });

      const receipts = receiptsResponse.receipts as Receipt[];
      return receipts.reduce((total, receipt) => total + receipt.total, 0);
    } catch (error) {
      console.error('Failed to calculate revenue:', error);
      return 0;
    }
  }
}

export default ReceiptService;