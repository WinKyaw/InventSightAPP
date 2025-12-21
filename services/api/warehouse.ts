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
    
    const inventoryList = parseWarehouseInventoryResponse<WarehouseInventoryRow>(
      response, 
      'inventory', 
      'Inventory API'
    );
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
    
    const restocksList = parseWarehouseInventoryResponse<WarehouseRestock>(
      response,
      'additions',
      'Restocks API'
    );
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
    
    const salesList = parseWarehouseInventoryResponse<WarehouseSale>(
      response,
      'withdrawals',
      'Sales API'
    );
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
