import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability, WarehouseRestock, WarehouseSale } from '../../types/warehouse';

/**
 * Warehouse API Service
 * Handles warehouse inventory and availability operations
 */

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
 * Get list of all warehouses
 * Falls back to empty array if endpoint is not yet implemented
 */
export async function getWarehouses(): Promise<WarehouseSummary[]> {
  try {
    console.log('🏢 WarehouseService: Fetching warehouses');
    const response = await apiClient.get<WarehouseSummary[]>('/api/warehouses');
    
    console.log('📦 Raw response type:', typeof response);
    console.log('📦 Is array:', Array.isArray(response));
    
    const warehouseList = parseArrayResponse<WarehouseSummary>(response, 'Warehouses API');
    console.log('✅ Parsed warehouses:', warehouseList.length, 'warehouses');
    
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
 * Get inventory for a specific warehouse
 * ✅ FIXED: Changed from /api/warehouses/{id}/inventory to /api/warehouse-inventory/warehouse/{id}
 */
export async function getWarehouseInventory(warehouseId: string): Promise<WarehouseInventoryRow[]> {
  try {
    console.log('📦 WarehouseService: Fetching inventory for warehouse:', warehouseId);
    console.log('📦 API endpoint: /api/warehouse-inventory/warehouse/' + warehouseId);
    
    const response = await apiClient.get<any>(
      `/api/warehouse-inventory/warehouse/${warehouseId}`
    );
    
    console.log('📦 Inventory response:', response);
    
    // Handle response format: { success: true, inventory: [...], count: 0 }
    if (response?.inventory) {
      return response.inventory;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data) {
      // If response has a data field, check if it contains inventory
      if (response.data?.inventory) {
        return response.data.inventory;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    const inventoryList = parseArrayResponse<WarehouseInventoryRow>(response, 'Inventory API');
    console.log('✅ Loaded', inventoryList.length, 'inventory items');
    
    return inventoryList;
  } catch (error) {
    console.error('❌ WarehouseService: Error fetching inventory:', error);
    console.error('   Failed endpoint: /api/warehouse-inventory/warehouse/' + warehouseId);
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get product availability across all warehouses
 */
export async function getProductAvailability(productId: string): Promise<ProductAvailability> {
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
 * Get warehouse restocks (additions)
 * ✅ FIXED: Changed from /api/warehouses/{id}/restocks to /api/warehouse-inventory/warehouse/{id}/additions
 */
export async function getWarehouseRestocks(warehouseId: string): Promise<WarehouseRestock[]> {
  try {
    console.log('📥 WarehouseService: Fetching restocks for warehouse:', warehouseId);
    console.log('📥 API endpoint: /api/warehouse-inventory/warehouse/' + warehouseId + '/additions');
    
    const response = await apiClient.get<any>(
      `/api/warehouse-inventory/warehouse/${warehouseId}/additions`
    );
    
    console.log('📥 Restocks response:', response);
    
    // Handle response format: { success: true, additions: [...], count: 0 }
    if (response?.additions) {
      return response.additions;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data) {
      // If response has a data field, check if it contains additions
      if (response.data?.additions) {
        return response.data.additions;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    const restocksList = parseArrayResponse<WarehouseRestock>(response, 'Restocks API');
    console.log('✅ Loaded', restocksList.length, 'restocks');
    
    return restocksList;
  } catch (error) {
    console.error('❌ WarehouseService: Error fetching restocks:', error);
    console.error('   Failed endpoint: /api/warehouse-inventory/warehouse/' + warehouseId + '/additions');
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get warehouse sales (withdrawals)
 * ✅ FIXED: Changed from /api/warehouses/{id}/sales to /api/warehouse-inventory/warehouse/{id}/withdrawals
 */
export async function getWarehouseSales(warehouseId: string): Promise<WarehouseSale[]> {
  try {
    console.log('💰 WarehouseService: Fetching sales for warehouse:', warehouseId);
    console.log('💰 API endpoint: /api/warehouse-inventory/warehouse/' + warehouseId + '/withdrawals');
    
    const response = await apiClient.get<any>(
      `/api/warehouse-inventory/warehouse/${warehouseId}/withdrawals`
    );
    
    console.log('💰 Sales response:', response);
    
    // Handle response format: { success: true, withdrawals: [...], count: 0 }
    if (response?.withdrawals) {
      return response.withdrawals;
    } else if (Array.isArray(response)) {
      return response;
    } else if (response?.data) {
      // If response has a data field, check if it contains withdrawals
      if (response.data?.withdrawals) {
        return response.data.withdrawals;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    }
    
    const salesList = parseArrayResponse<WarehouseSale>(response, 'Sales API');
    console.log('✅ Loaded', salesList.length, 'sales');
    
    return salesList;
  } catch (error) {
    console.error('❌ WarehouseService: Error fetching sales:', error);
    console.error('   Failed endpoint: /api/warehouse-inventory/warehouse/' + warehouseId + '/withdrawals');
    return []; // Return empty array on error instead of throwing
  }
}

export const WarehouseService = {
  getWarehouses,
  getWarehouseInventory,
  getProductAvailability,
  getWarehouseRestocks,
  getWarehouseSales,
};

export default WarehouseService;
