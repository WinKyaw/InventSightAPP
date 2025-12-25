import { apiClient } from './apiClient';
import { API_CONFIG } from './config';
import {
  PredefinedItem,
  PredefinedItemRequest,
  PredefinedItemsResponse,
  BulkCreateResponse,
  ImportResponse,
} from '../../types/predefinedItems';

/**
 * Predefined Items Service
 * 
 * Manages master catalog of items for GM+ users and Supply Management Specialists
 */
export class PredefinedItemsService {
  private static BASE_URL = `${API_CONFIG.BASE_URL}/api/predefined-items`;

  /**
   * Get all predefined items with pagination and filters
   * @param page Page number (0-indexed)
   * @param size Items per page
   * @param search Search query (name, SKU, or category)
   * @param category Filter by category
   * @returns Promise<PredefinedItemsResponse>
   */
  static async getAllItems(
    page: number = 0,
    size: number = 20,
    search?: string,
    category?: string
  ): Promise<PredefinedItemsResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (category && category !== 'All') {
        params.append('category', category);
      }

      const response = await apiClient.get<PredefinedItemsResponse>(
        `${this.BASE_URL}?${params.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Failed to fetch predefined items:', error);
      throw error;
    }
  }

  /**
   * Create a new predefined item
   * @param item Item data
   * @returns Promise<PredefinedItem>
   */
  static async createItem(item: PredefinedItemRequest): Promise<PredefinedItem> {
    try {
      const response = await apiClient.post<PredefinedItem>(this.BASE_URL, item);
      return response;
    } catch (error) {
      console.error('Failed to create predefined item:', error);
      throw error;
    }
  }

  /**
   * Update an existing predefined item
   * @param id Item ID
   * @param item Updated item data
   * @returns Promise<PredefinedItem>
   */
  static async updateItem(id: string, item: PredefinedItemRequest): Promise<PredefinedItem> {
    try {
      const response = await apiClient.put<PredefinedItem>(`${this.BASE_URL}/${id}`, item);
      return response;
    } catch (error) {
      console.error('Failed to update predefined item:', error);
      throw error;
    }
  }

  /**
   * Delete a predefined item (soft delete)
   * @param id Item ID
   * @returns Promise<void>
   */
  static async deleteItem(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_URL}/${id}`);
    } catch (error) {
      console.error('Failed to delete predefined item:', error);
      throw error;
    }
  }

  /**
   * Bulk create multiple items at once
   * @param items Array of items to create
   * @param companyId Company ID (required)
   * @returns Promise<BulkCreateResponse>
   */
  static async bulkCreateItems(items: PredefinedItemRequest[], companyId: string): Promise<BulkCreateResponse> {
    try {
      const response = await apiClient.post<BulkCreateResponse>(
        `${this.BASE_URL}/bulk-create?companyId=${companyId}`,
        items
      );
      return response;
    } catch (error) {
      console.error('Failed to bulk create items:', error);
      throw error;
    }
  }

  /**
   * Import items from CSV data
   * @param csvData Parsed CSV data as array of items
   * @returns Promise<ImportResponse>
   */
  static async importCSV(csvData: PredefinedItemRequest[]): Promise<ImportResponse> {
    try {
      const response = await apiClient.post<ImportResponse>(
        `${this.BASE_URL}/import`,
        { items: csvData }
      );
      return response;
    } catch (error) {
      console.error('Failed to import CSV:', error);
      throw error;
    }
  }

  /**
   * Export all items to CSV format
   * @returns Promise<string> CSV content
   */
  static async exportCSV(): Promise<string> {
    try {
      const response = await apiClient.get<string>(`${this.BASE_URL}/export`, {
        headers: {
          'Accept': 'text/csv',
        },
      });
      return response;
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  }

  /**
   * Associate stores with a predefined item
   * @param itemId Item ID
   * @param storeIds Array of store IDs
   * @returns Promise<void>
   */
  static async associateStores(itemId: string, storeIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_URL}/${itemId}/stores`, { storeIds });
    } catch (error) {
      console.error('Failed to associate stores:', error);
      throw error;
    }
  }

  /**
   * Associate warehouses with a predefined item
   * @param itemId Item ID
   * @param warehouseIds Array of warehouse IDs
   * @returns Promise<void>
   */
  static async associateWarehouses(itemId: string, warehouseIds: string[]): Promise<void> {
    try {
      await apiClient.post(`${this.BASE_URL}/${itemId}/warehouses`, { warehouseIds });
    } catch (error) {
      console.error('Failed to associate warehouses:', error);
      throw error;
    }
  }
}
