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
   * @param companyId Company ID (REQUIRED)
   * @param page Page number (0-indexed)
   * @param size Items per page
   * @param search Search query (name, SKU, or category)
   * @param category Filter by category
   * @returns Promise<PredefinedItemsResponse>
   */
  static async getAllItems(
    companyId: string,
    page: number = 0,
    size: number = 20,
    search?: string,
    category?: string
  ): Promise<PredefinedItemsResponse> {
    try {
      const params = new URLSearchParams({
        companyId,
        page: page.toString(),
        size: size.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (category && category !== 'All') {
        params.append('category', category);
      }

      // Backend returns nested structure, so we get the raw response
      const rawResponse = await apiClient.get<{
        success: boolean;
        message: string;
        data: {
          items: PredefinedItem[];
          totalElements: number;
          totalPages: number;
          currentPage: number;
          pageSize: number;
        }
      }>(`${this.BASE_URL}?${params.toString()}`);

      // Transform to ensure consistent structure with null safety
      return {
        success: rawResponse.success,
        message: rawResponse.message,
        data: {
          items: rawResponse.data?.items || [],
          totalElements: rawResponse.data?.totalElements || 0,
          totalPages: rawResponse.data?.totalPages || 0,
          currentPage: rawResponse.data?.currentPage || 0,
          pageSize: rawResponse.data?.pageSize || size,
        }
      };
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
   * @param storeIds Optional array of store IDs to associate with all items
   * @param warehouseIds Optional array of warehouse IDs to associate with all items
   * @returns Promise<BulkCreateResponse>
   */
  static async bulkCreateItems(
    items: PredefinedItemRequest[], 
    companyId: string,
    storeIds?: string[],
    warehouseIds?: string[]
  ): Promise<BulkCreateResponse> {
    try {
      // Add location associations to all items
      const itemsWithLocations = items.map(item => ({
        ...item,
        storeIds: item.storeIds || storeIds,
        warehouseIds: item.warehouseIds || warehouseIds,
      }));

      const response = await apiClient.post<BulkCreateResponse>(
        `${this.BASE_URL}/bulk-create?companyId=${companyId}`,
        itemsWithLocations
      );
      return response;
    } catch (error) {
      console.error('Failed to bulk create items:', error);
      throw error;
    }
  }

  /**
   * Import items from CSV file
   * @param formData FormData containing the CSV file
   * @param companyId Company ID
   * @param storeIds Optional array of store IDs to associate with imported items
   * @param warehouseIds Optional array of warehouse IDs to associate with imported items
   * @returns Promise<any> Import response with successful and failed counts
   */
  static async importCSV(
    formData: FormData, 
    companyId: string,
    storeIds?: string[],
    warehouseIds?: string[]
  ): Promise<any> {
    try {
      console.log('📥 Importing CSV for company:', companyId);
      
      // Build query params with location IDs if provided
      let url = `${this.BASE_URL}/import-csv?companyId=${companyId}`;
      if (storeIds && storeIds.length > 0) {
        url += `&storeIds=${storeIds.join(',')}`;
      }
      if (warehouseIds && warehouseIds.length > 0) {
        url += `&warehouseIds=${warehouseIds.join(',')}`;
      }
      
      const response = await apiClient.post(
        url,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ CSV Import Response:', response);
      return response;
    } catch (error) {
      console.error('❌ CSV Import Error:', error);
      throw error;
    }
  }

  /**
   * Export items to CSV file
   * @param companyId Company ID
   * @returns Promise<string> CSV content
   */
  static async exportCSV(companyId: string): Promise<string> {
    try {
      console.log('📤 Exporting CSV for company:', companyId);
      
      const response = await apiClient.get<string>(
        `${this.BASE_URL}/export-csv?companyId=${companyId}`,
        {
          headers: {
            'Accept': 'text/csv',
          },
        }
      );
      
      console.log('✅ CSV Export successful');
      return response;
    } catch (error) {
      console.error('❌ CSV Export Error:', error);
      throw error;
    }
  }

  /**
   * Import items from CSV data
   * @param csvData Parsed CSV data as array of items
   * @returns Promise<ImportResponse>
   */
  static async importCSVData(csvData: PredefinedItemRequest[]): Promise<ImportResponse> {
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
  static async exportCSVData(): Promise<string> {
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
      await apiClient.post(`${this.BASE_URL}/${itemId}/stores`, { locationIds: storeIds });
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
      await apiClient.post(`${this.BASE_URL}/${itemId}/warehouses`, { locationIds: warehouseIds });
    } catch (error) {
      console.error('Failed to associate warehouses:', error);
      throw error;
    }
  }
}
