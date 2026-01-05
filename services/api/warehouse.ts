import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability, WarehouseRestock, WarehouseSale, WarehouseAssignment, WarehousePermissionResponse, WarehouseUser, EmployeeWarehouseResponse } from '../../types/warehouse';

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

interface CachedData {
  data: any;
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
  // Cache storage - unified cache for all paginated data
  private cache = new Map<string, CachedData>();
  private warehousesCache: CacheEntry<WarehouseSummary[]> | null = null;
  private readonly CACHE_TTL = 60000; // 1 minute

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
    this.cache.clear();
    this.warehousesCache = null;
  }

  /**
   * Clear cache for specific warehouse
   */
  clearWarehouseCache(warehouseId: string) {
    console.log(`🗑️ Clearing cache for warehouse: ${warehouseId}`);
    
    // Clear all cache entries for this warehouse
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(warehouseId)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`✅ Cleared ${keysToDelete.length} cache entries`);
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
   * Get warehouse inventory (with 1-minute cache and pagination)
   */
  async getWarehouseInventory(
    warehouseId: string, 
    forceRefresh: boolean = false,
    page: number = 0,
    size: number = 20
  ): Promise<any> {
    const cacheKey = `inventory:${warehouseId}:${page}:${size}`;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log(`📦 Returning cached inventory (page ${page}/${size} items)`);
          return cached.data;
        }
      }

      console.log(`📦 Fetching inventory from API (page ${page}, size ${size})`);
      console.log(`📦 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}?page=${page}&size=${size}`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}?page=${page}&size=${size}`
      );
      
      console.log('📦 Inventory response:', response);
      
      const inventoryList = parseWarehouseInventoryResponse<WarehouseInventoryRow>(
        response, 
        'inventory', 
        'Inventory API'
      );
      console.log(`✅ Loaded ${inventoryList.length} inventory items (page ${page})`);

      // Build response with pagination metadata
      const result = {
        inventory: inventoryList,
        hasMore: response?.hasMore ?? (inventoryList.length >= size),
        currentPage: response?.currentPage ?? page,
        totalPages: response?.totalPages ?? Math.ceil((response?.totalItems ?? 0) / size),
        totalItems: response?.totalItems ?? inventoryList.length,
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`✅ Inventory cached for 1 minute (${inventoryList.length} items)`);
      console.log(`📊 Inventory stats: page ${result.currentPage + 1}/${result.totalPages}, total: ${result.totalItems}, hasMore: ${result.hasMore}`);

      return result;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching inventory:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}`);
      return { inventory: [], hasMore: false, currentPage: page, totalPages: 0, totalItems: 0 };
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
   * Get warehouse restocks/additions (with 1-minute cache and pagination)
   */
  async getWarehouseRestocks(
    warehouseId: string,
    forceRefresh: boolean = false,
    page: number = 0,
    size: number = 20
  ): Promise<any> {
    const cacheKey = `restocks:${warehouseId}:${page}:${size}`;

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log(`📥 Returning cached restocks (page ${page}/${size} items)`);
          return cached.data;
        }
      }

      console.log(`📥 Fetching restocks from API (page ${page}, size ${size})`);
      console.log(`📥 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/additions?page=${page}&size=${size}`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}/additions?page=${page}&size=${size}`
      );
      
      console.log('📥 Restocks response:', response);
      
      const restocksList = parseWarehouseInventoryResponse<WarehouseRestock>(
        response,
        'additions',
        'Restocks API'
      );
      console.log(`✅ Loaded ${restocksList.length} restocks (page ${page})`);

      // Build response with pagination metadata
      const result = {
        additions: restocksList,
        hasMore: response?.hasMore ?? (restocksList.length >= size),
        currentPage: response?.currentPage ?? page,
        totalPages: response?.totalPages ?? Math.ceil((response?.totalItems ?? 0) / size),
        totalItems: response?.totalItems ?? restocksList.length,
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`✅ Restocks cached for 1 minute (${restocksList.length} items)`);
      console.log(`📊 Restocks stats: page ${result.currentPage + 1}/${result.totalPages}, total: ${result.totalItems}, hasMore: ${result.hasMore}`);

      return result;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching restocks:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/additions`);
      return { additions: [], hasMore: false, currentPage: page, totalPages: 0, totalItems: 0 };
    }
  }

  /**
   * Get warehouse sales/withdrawals (with 1-minute cache and pagination)
   */
  async getWarehouseSales(
    warehouseId: string,
    forceRefresh: boolean = false,
    page: number = 0,
    size: number = 20
  ): Promise<any> {
    const cacheKey = `sales:${warehouseId}:${page}:${size}`;

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          console.log(`💰 Returning cached sales (page ${page}/${size} items)`);
          return cached.data;
        }
      }

      console.log(`💰 Fetching sales from API (page ${page}, size ${size})`);
      console.log(`💰 API endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/withdrawals?page=${page}&size=${size}`);
      
      const response = await apiClient.get<any>(
        `/api/warehouse-inventory/warehouse/${warehouseId}/withdrawals?page=${page}&size=${size}`
      );
      
      console.log('💰 Sales response:', response);
      
      const salesList = parseWarehouseInventoryResponse<WarehouseSale>(
        response,
        'withdrawals',
        'Sales API'
      );
      console.log(`✅ Loaded ${salesList.length} sales (page ${page})`);

      // Build response with pagination metadata
      const result = {
        withdrawals: salesList,
        hasMore: response?.hasMore ?? (salesList.length >= size),
        currentPage: response?.currentPage ?? page,
        totalPages: response?.totalPages ?? Math.ceil((response?.totalItems ?? 0) / size),
        totalItems: response?.totalItems ?? salesList.length,
      };

      // Cache the response
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      console.log(`✅ Sales cached for 1 minute (${salesList.length} items)`);
      console.log(`📊 Sales stats: page ${result.currentPage + 1}/${result.totalPages}, total: ${result.totalItems}, hasMore: ${result.hasMore}`);

      return result;
    } catch (error) {
      console.error('❌ WarehouseService: Error fetching sales:', error);
      console.error(`   Failed endpoint: /api/warehouse-inventory/warehouse/${warehouseId}/withdrawals`);
      return { withdrawals: [], hasMore: false, currentPage: page, totalPages: 0, totalItems: 0 };
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
   * ✅ FIXED: Use correct warehouse-inventory endpoint
   */
  async assignWarehouseToEmployee(request: {
    userId: string;
    warehouseId: string;
    permissionType?: 'READ' | 'READ_WRITE';
    // Legacy parameters kept for backward compatibility but not used
    isPermanent?: boolean;
    expiresAt?: string;
    notes?: string;
  }): Promise<void> {
    try {
      console.log('👤 Assigning warehouse to employee:', request);
      
      // ✅ FIXED: Use correct endpoint
      // Changed from: POST /api/warehouse-assignments
      // To: POST /api/warehouse-inventory/warehouse/{warehouseId}/permissions
      const response = await apiClient.post(
        `/api/warehouse-inventory/warehouse/${request.warehouseId}/permissions`,
        {
          userId: request.userId,
          permissionType: request.permissionType || 'READ_WRITE', // Default to READ_WRITE
        }
      );
      
      console.log('✅ Warehouse assigned to employee successfully:', response);
    } catch (error: any) {
      console.error('❌ Error assigning warehouse:', error.message);
      throw error;
    }
  }

  /**
   * Get employee's warehouse assignments with permissions
   * ✅ FIXED: Return full response including userId
   */
  async getEmployeeWarehouses(employeeId: string): Promise<EmployeeWarehouseResponse> {
    try {
      console.log(`🏢 Fetching warehouse assignments for employee: ${employeeId}`);

      // ✅ FIXED: Changed from /warehouse-inventory/user/{id}/warehouses
      //           to /warehouse-inventory/employee/{id}/warehouses
      const response = await apiClient.get(
        `/api/warehouse-inventory/employee/${employeeId}/warehouses`
      );

      console.log('🏢 Warehouse assignments response:', response);

      // Handle the API response format
      const responseData = (response as any);
      if (responseData.success) {
        const assignments = responseData.warehouses || [];
        console.log(`✅ Loaded ${assignments.length} warehouse assignments for ${responseData.employeeName || 'employee'}`);
        
        // ✅ FIXED: Return full response with userId, employeeId, and warehouses
        return {
          userId: responseData.userId,
          employeeId: responseData.employeeId,
          employeeName: responseData.employeeName,
          username: responseData.username,
          warehouses: assignments.map((assignment: any) => ({
            id: assignment.id,
            userId: responseData.userId, // ✅ Include userId in each assignment
            employeeId: responseData.employeeId,
            warehouseId: assignment.warehouseId || assignment.warehouse?.id,
            warehouseName: assignment.warehouseName || assignment.warehouse?.name,
            warehouseLocation: assignment.warehouseLocation || assignment.warehouse?.location,
            permissionType: assignment.permissionType,
            isPermanent: assignment.isPermanent !== undefined ? assignment.isPermanent : true,
            grantedBy: assignment.grantedBy,
            grantedAt: assignment.grantedAt,
            createdAt: assignment.grantedAt,
            createdBy: assignment.grantedBy,
            isActive: assignment.isActive,
            warehouse: assignment.warehouse,
          })),
          count: assignments.length,
        };
      } else {
        console.warn('⚠️ API returned success: false');
        return { userId: null, employeeId, warehouses: [], count: 0 };
      }
    } catch (error: any) {
      console.error('❌ Error fetching employee warehouses:', error.message);
      return { userId: null, employeeId, warehouses: [], count: 0 };
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

  /**
   * Check warehouse permissions for current user
   */
  async checkWarehousePermissions(warehouseId: string): Promise<WarehousePermissionResponse> {
    try {
      console.log(`🔐 Checking permissions for warehouse: ${warehouseId}`);
      
      const response = await apiClient.get<WarehousePermissionResponse>(
        `/api/warehouse-inventory/warehouse/${warehouseId}/permissions`
      );
      
      console.log('🔐 Permissions response:', response);
      
      // Handle different response formats
      const permissionsData = (response as any)?.data || response;
      
      console.log('✅ User permissions:', permissionsData.permissions || permissionsData);
      
      return permissionsData;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return {
        success: false,
        permissions: {
          canRead: false,
          canWrite: false,
          canAddInventory: false,
          canWithdrawInventory: false,
          isGMPlus: false,
        },
      };
    }
  }

  /**
   * Grant warehouse permission to user (GM+ only)
   */
  async grantWarehousePermission(
    warehouseId: string,
    userId: string,
    permissionType: 'READ' | 'READ_WRITE'
  ): Promise<any> {
    try {
      console.log(`🔐 Granting ${permissionType} permission to user ${userId} on warehouse ${warehouseId}`);
      
      const response = await apiClient.post(
        `/api/warehouse-inventory/warehouse/${warehouseId}/permissions`,
        {
          userId,
          permissionType,
        }
      );
      
      console.log('✅ Permission granted:', response);
      return response;
    } catch (error) {
      console.error('❌ Error granting permission:', error);
      throw error;
    }
  }

  /**
   * List users with access to warehouse (GM+ only)
   */
  async listWarehouseUsers(warehouseId: string): Promise<any> {
    try {
      console.log(`👥 Fetching users with access to warehouse: ${warehouseId}`);
      
      const response = await apiClient.get(
        `/api/warehouse-inventory/warehouse/${warehouseId}/users`
      );
      
      // Handle different response formats
      const responseData = (response as any)?.data || response;
      const users = responseData?.users || [];
      
      console.log(`✅ Found ${users.length} users with access`);
      return { success: true, users };
    } catch (error) {
      console.error('❌ Error fetching warehouse users:', error);
      return { success: false, users: [] };
    }
  }

  /**
   * Revoke warehouse permission (GM+ only)
   */
  async revokeWarehousePermission(
    warehouseId: string,
    userId: string
  ): Promise<any> {
    try {
      console.log(`🔐 Revoking permission for user ${userId} on warehouse ${warehouseId}`);
      
      const response = await apiClient.delete(
        `/api/warehouse-inventory/warehouse/${warehouseId}/permissions/${userId}`
      );
      
      console.log('✅ Permission revoked:', response);
      return response;
    } catch (error) {
      console.error('❌ Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get products available for a specific warehouse
   * These are products from predefined items assigned to this warehouse
   */
  async getWarehouseAvailableProducts(warehouseId: string): Promise<any[]> {
    try {
      console.log(`📦 Fetching available products for warehouse: ${warehouseId}`);
      
      const response = await apiClient.get(
        `/api/warehouses/${warehouseId}/available-products`
      );
      
      // Handle different response formats
      const responseData = (response as any)?.data || response;
      const products = responseData?.products || [];
      
      console.log(`✅ Found ${products.length} products available for this warehouse`);
      return products;
    } catch (error) {
      console.error('❌ Error fetching warehouse products:', error);
      // Return empty array instead of throwing to handle gracefully
      return [];
    }
  }
}

// Export singleton instance
const WarehouseService = new WarehouseServiceClass();

// Export legacy functions for backward compatibility
export const getWarehouses = (forceRefresh?: boolean) => WarehouseService.getWarehouses(forceRefresh);
export const getWarehouseInventory = (warehouseId: string, forceRefresh?: boolean, page?: number, size?: number) => 
  WarehouseService.getWarehouseInventory(warehouseId, forceRefresh, page, size);
export const getProductAvailability = (productId: string) => WarehouseService.getProductAvailability(productId);
export const getWarehouseRestocks = (warehouseId: string, forceRefresh?: boolean, page?: number, size?: number) => 
  WarehouseService.getWarehouseRestocks(warehouseId, forceRefresh, page, size);
export const getWarehouseSales = (warehouseId: string, forceRefresh?: boolean, page?: number, size?: number) => 
  WarehouseService.getWarehouseSales(warehouseId, forceRefresh, page, size);
export const getWarehouseAvailableProducts = (warehouseId: string) => 
  WarehouseService.getWarehouseAvailableProducts(warehouseId);

export { WarehouseService };
export default WarehouseService;
