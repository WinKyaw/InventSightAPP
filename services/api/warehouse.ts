import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability, WarehouseRestock, WarehouseSale, WarehouseAssignment } from '../../types/warehouse';

/**
 * Warehouse API Service
 * Handles warehouse inventory and availability operations with 1-minute caching
 */

// ✅ TypeScript enums for valid transaction types
export enum WarehouseAdditionTransactionType {
  RECEIPT = 'RECEIPT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  RETURN = 'RETURN',
}

export enum WarehouseWithdrawalTransactionType {
  ISSUE = 'ISSUE',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  EXPIRED = 'EXPIRED',
}

// ✅ Cache with 1-minute expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

/**
 * Helper function to parse API response and extract array data
 * Handles different response formats from backend:
 * 1. Direct array: [...]
 * 2. Nested in data: { data: [...] }
 * 3. Paginated: { data: { content: [...] } }
 */
function parseArrayResponse<T>(response: unknown, context: string): T[] {
  // apiClient.get may return response.data directly or the full response
  // Try to access .data first, then fall back to the response itself
  const data = (response as any)?.data ?? response;
  
  // Handle direct array
  if (Array.isArray(data)) {
    return data;
  }
  
  // Handle paginated response with content
  if (data && typeof data === 'object' && Array.isArray(data.content)) {
    return data.content;
  }
  
  // Handle null/undefined or unexpected format
  if (data === undefined || data === null) {
    console.warn(`⚠️ ${context} returned null/undefined`);
    return [];
  }
  
  console.warn(`⚠️ ${context} unexpected format:`, typeof data);
  return [];
}

/**
 * Helper function to parse warehouse-inventory API responses
 * Handles the specific response format: { success: true, [fieldName]: [...], count: 0 }
 * @param response The API response
 * @param fieldName The field name containing the array (e.g., 'inventory', 'additions', 'withdrawals')
 * @param context Context string for logging
 */
function parseWarehouseInventoryResponse<T>(response: unknown, fieldName: string, context: string): T[] {
  // Check if response has the expected field directly
  if ((response as any)?.[fieldName]) {
    return (response as any)[fieldName];
  }
  
  // Check if response is a direct array
  if (Array.isArray(response)) {
    return response;
  }
  
  // Check if response.data has the expected field
  if ((response as any)?.data?.[fieldName]) {
    return (response as any).data[fieldName];
  }
  
  // Check if response.data is a direct array
  if (Array.isArray((response as any)?.data)) {
    return (response as any).data;
  }
  
  // Fallback to the generic parser
  return parseArrayResponse<T>(response, context);
}

class WarehouseServiceClass {
  // Cache storage
  private inventoryCache = new Map<string, CacheEntry<WarehouseInventoryRow[]>>();
  private additionsCache = new Map<string, CacheEntry<WarehouseRestock[]>>();
  private withdrawalsCache = new Map<string, CacheEntry<WarehouseSale[]>>();
  private warehousesCache: CacheEntry<WarehouseSummary[]> | null = null;

  /**
   * Check if cache is still valid (within 1 minute)
   */
  private isCacheValid<T>(cacheEntry: CacheEntry<T> | null | undefined): boolean {
    if (!cacheEntry) return false;
    const now = Date.now();
    const isValid = (now - cacheEntry.timestamp) < CACHE_DURATION;
    
    if (!isValid) {
      console.log('⏰ Cache expired (> 1 minute)');
    } else {
      const remainingSeconds = Math.floor((CACHE_DURATION - (now - cacheEntry.timestamp)) / 1000);
      console.log(`✅ Cache valid (${remainingSeconds}s remaining)`);
    }
    
    return isValid;
  }

  /**
   * Clear all warehouse caches
   */
  clearCache() {
    console.log('🗑️ Clearing all warehouse caches');
    this.inventoryCache.clear();
    this.additionsCache.clear();
    this.withdrawalsCache.clear();
    this.warehousesCache = null;
  }

  /**
   * Clear cache for specific warehouse
   */
  clearWarehouseCache(warehouseId: string) {
    console.log(`🗑️ Clearing cache for warehouse: ${warehouseId}`);
    this.inventoryCache.delete(warehouseId);
    this.additionsCache.delete(warehouseId);
    this.withdrawalsCache.delete(warehouseId);
  }

  /**
   * Get all warehouses (with 1-minute cache)
   */
  async getWarehouses(forceRefresh: boolean = false): Promise<WarehouseSummary[]> {
    try {
      // Check cache first
      if (!forceRefresh && this.isCacheValid(this.warehousesCache)) {
        console.log('📦 Returning cached warehouses');
        return this.warehousesCache!.data;
      }

      console.log('🏢 WarehouseService: Fetching warehouses from API');
      const response = await apiClient.get<WarehouseSummary[]>('/api/warehouses');
      
      console.log('📦 Raw response type:', typeof response);
      console.log('📦 Is array:', Array.isArray(response));
      
      const warehouseList = parseArrayResponse<WarehouseSummary>(response, 'Warehouses API');
      console.log('✅ Parsed warehouses:', warehouseList.length, 'warehouses');
      
      // Update cache
      this.warehousesCache = {
        data: warehouseList,
        timestamp: Date.now(),
      };
      
      console.log('✅ Warehouses cached for 1 minute');
      return warehouseList;
    } catch (error) {
      // If endpoint doesn't exist yet, return empty array gracefully
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn('Warehouses endpoint not yet available');
        return [];
      }
      console.error('❌ Error fetching warehouses:', error);
      return []; // Always return empty array on error instead of throwing
    }
  }

  /**
   * Get warehouse inventory (with 1-minute cache)
   */
  async getWarehouseInventory(
    warehouseId: string, 
    forceRefresh: boolean = false
  ): Promise<WarehouseInventoryRow[]> {
    try {
      // Check cache first
      const cached = this.inventoryCache.get(warehouseId);
      if (!forceRefresh && this.isCacheValid(cached)) {
        console.log(`📦 Returning cached inventory for warehouse: ${warehouseId}`);
        return cached!.data;
      }

      console.log('📦 Fetching inventory from API for warehouse:', warehouseId);
      console.log(`📦 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}`
      );
      
      console.log('📦 Inventory response:', response);
      
      const inventoryList = parseWarehouseInventoryResponse<WarehouseInventoryRow>(
        response, 
        'inventory', 
        'Inventory API'
      );
      console.log('✅ Loaded', inventoryList.length, 'inventory items');

      // Update cache
      this.inventoryCache.set(warehouseId, {
        data: inventoryList,
        timestamp: Date.now(),
      });

      console.log(`✅ Inventory cached for 1 minute (${inventoryList.length} items)`);
      return inventoryList;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching inventory:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}`);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Get product availability across all warehouses
   */
  async getProductAvailability(productId: string): Promise<ProductAvailability> {
    try {
      const response = await apiClient.get<ProductAvailability>(
        `/api/sales/inventory/availability?productId=${productId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch product availability:', error);
      throw error;
    }
  }

  /**
   * Get warehouse restocks/additions (with 1-minute cache)
   */
  async getWarehouseRestocks(
    warehouseId: string,
    forceRefresh: boolean = false
  ): Promise<WarehouseRestock[]> {
    try {
      // Check cache first
      const cached = this.additionsCache.get(warehouseId);
      if (!forceRefresh && this.isCacheValid(cached)) {
        console.log(`📥 Returning cached restocks for warehouse: ${warehouseId}`);
        return cached!.data;
      }

      console.log('📥 Fetching restocks from API for warehouse:', warehouseId);
      console.log(`📥 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/additions`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}/additions`
      );
      
      console.log('📥 Restocks response:', response);
      
      const restocksList = parseWarehouseInventoryResponse<WarehouseRestock>(
        response,
        'additions',
        'Restocks API'
      );
      console.log('✅ Loaded', restocksList.length, 'restocks');

      // Update cache
      this.additionsCache.set(warehouseId, {
        data: restocksList,
        timestamp: Date.now(),
      });

      console.log(`✅ Restocks cached for 1 minute (${restocksList.length} items)`);
      return restocksList;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching restocks:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/additions`);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Get warehouse sales/withdrawals (with 1-minute cache)
   */
  async getWarehouseSales(
    warehouseId: string,
    forceRefresh: boolean = false
  ): Promise<WarehouseSale[]> {
    try {
      // Check cache first
      const cached = this.withdrawalsCache.get(warehouseId);
      if (!forceRefresh && this.isCacheValid(cached)) {
        console.log(`💰 Returning cached sales for warehouse: ${warehouseId}`);
        return cached!.data;
      }

      console.log('💰 Fetching sales from API for warehouse:', warehouseId);
      console.log(`💰 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/withdrawals`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}/withdrawals`
      );
      
      console.log('💰 Sales response:', response);
      
      const salesList = parseWarehouseInventoryResponse<WarehouseSale>(
        response,
        'withdrawals',
        'Sales API'
      );
      console.log('✅ Loaded', salesList.length, 'sales');

      // Update cache
      this.withdrawalsCache.set(warehouseId, {
        data: salesList,
        timestamp: Date.now(),
      });

      console.log(`✅ Sales cached for 1 minute (${salesList.length} items)`);
      return salesList;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching sales:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/withdrawals`);
      return []; // Return empty array on error instead of throwing
    }
  }

  /**
   * Add inventory to warehouse (clears cache after success)
   * ✅ FIXED: Uses RECEIPT instead of MANUAL_ADDITION
   */
  async addInventory(request: {
    warehouseId: string;
    productId: string;
    quantity: number;
    transactionType?: WarehouseAdditionTransactionType | string;
    notes?: string;
  }): Promise<void> {
    try {
      console.log('➕ Adding inventory:', request);
      
      await apiClient.post('/api/warehouse-inventory/add', {
        warehouseId: request.warehouseId,
        productId: request.productId,
        quantity: request.quantity,
        transactionType: request.transactionType || WarehouseAdditionTransactionType.RECEIPT,
        notes: request.notes,
      });

      // Clear cache for this warehouse
      this.clearWarehouseCache(request.warehouseId);
      
      console.log('✅ Inventory added successfully, cache cleared');
    } catch (error: any) {
      console.error('❌ Error adding inventory:', error.message);
      throw error;
    }
  }

  /**
   * Withdraw inventory from warehouse (clears cache after success)
   * ✅ FIXED: Uses ISSUE instead of SALE (valid backend enum)
   */
  async withdrawInventory(request: {
    warehouseId: string;
    productId: string;
    quantity: number;
    transactionType?: WarehouseWithdrawalTransactionType | string;
    notes?: string;
  }): Promise<void> {
    try {
      console.log('➖ Withdrawing inventory:', request);
      
      await apiClient.post('/api/warehouse-inventory/withdraw', {
        warehouseId: request.warehouseId,
        productId: request.productId,
        quantity: request.quantity,
        transactionType: request.transactionType || WarehouseWithdrawalTransactionType.ISSUE,
        notes: request.notes,
      });

      // Clear cache for this warehouse
      this.clearWarehouseCache(request.warehouseId);
      
      console.log('✅ Inventory withdrawn successfully, cache cleared');
    } catch (error: any) {
      console.error('❌ Error withdrawing inventory:', error.message);
      throw error;
    }
  }

  /**
   * Assign warehouse to employee
   */
  async assignWarehouseToEmployee(request: {
    userId: string;
    warehouseId: string;
    isPermanent: boolean;
    expiresAt?: string; // ISO date string for temporary assignments
    notes?: string;
  }): Promise<void> {
    try {
      console.log('👤 Assigning warehouse to employee:', request);
      
      await apiClient.post('/api/warehouse-assignments', {
        userId: request.userId,
        warehouseId: request.warehouseId,
        isPermanent: request.isPermanent,
        expiresAt: request.expiresAt,
        notes: request.notes,
      });
      
      console.log('✅ Warehouse assigned to employee successfully');
    } catch (error: any) {
      console.error('❌ Error assigning warehouse:', error.message);
      throw error;
    }
  }

  /**
   * Get employee warehouse assignments
   */
  async getEmployeeWarehouses(userId: string): Promise<WarehouseAssignment[]> {
    try {
      console.log('👤 Fetching warehouse assignments for user:', userId);
      
      const response = await apiClient.get(`/api/warehouse-assignments/user/${userId}`);
      
      const assignments = response?.assignments || response?.data || [];
      return Array.isArray(assignments) ? assignments : [];
    } catch (error: any) {
      console.error('❌ Error fetching employee warehouses:', error.message);
      return [];
    }
  }

  /**
   * Remove warehouse assignment from employee
   */
  async removeWarehouseAssignment(assignmentId: string): Promise<void> {
    try {
      console.log('🗑️ Removing warehouse assignment:', assignmentId);
      
      await apiClient.delete(`/api/warehouse-assignments/${assignmentId}`);
      
      console.log('✅ Warehouse assignment removed successfully');
    } catch (error: any) {
      console.error('❌ Error removing warehouse assignment:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const WarehouseService = new WarehouseServiceClass();

// Export legacy functions for backward compatibility
export const getWarehouses = (forceRefresh?: boolean) => WarehouseService.getWarehouses(forceRefresh);
export const getWarehouseInventory = (warehouseId: string, forceRefresh?: boolean) => 
  WarehouseService.getWarehouseInventory(warehouseId, forceRefresh);
export const getProductAvailability = (productId: string) => WarehouseService.getProductAvailability(productId);
export const getWarehouseRestocks = (warehouseId: string, forceRefresh?: boolean) => 
  WarehouseService.getWarehouseRestocks(warehouseId, forceRefresh);
export const getWarehouseSales = (warehouseId: string, forceRefresh?: boolean) => 
  WarehouseService.getWarehouseSales(warehouseId, forceRefresh);

export { WarehouseService };
export default WarehouseService;
