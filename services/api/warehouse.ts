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
 */
export async function getWarehouseInventory(warehouseId: string): Promise<WarehouseInventoryRow[]> {
  try {
    console.log('📦 WarehouseService: Fetching inventory for warehouse:', warehouseId);
    console.log(`📦 API endpoint: /api/warehouses/${warehouseId}/inventory`);
    
    const response = await apiClient.get<WarehouseInventoryRow[]>(
      `/api/warehouses/${warehouseId}/inventory`
    );
    
    console.log('📦 Inventory response type:', typeof response);
    console.log('✅ Inventory fetched successfully');
    
    const inventoryList = parseArrayResponse<WarehouseInventoryRow>(response, 'Inventory API');
    console.log('✅ Loaded', inventoryList.length, 'inventory items');
    
    return inventoryList;
  } catch (error) {
    console.error('❌ WarehouseService: Error fetching inventory:', error);
    console.error(`❌ Failed endpoint: /api/warehouses/${warehouseId}/inventory`);
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
 * Get warehouse restocks
 */
export async function getWarehouseRestocks(warehouseId: string): Promise<WarehouseRestock[]> {
  try {
    console.log('📥 WarehouseService: Fetching restocks for warehouse:', warehouseId);
    const response = await apiClient.get<WarehouseRestock[]>(
      `/api/warehouses/${warehouseId}/restocks`
    );
    
    console.log('📥 Restocks response type:', typeof response);
    
    const restocksList = parseArrayResponse<WarehouseRestock>(response, 'Restocks API');
    console.log('✅ Loaded', restocksList.length, 'restocks');
    
    return restocksList;
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Warehouse restocks endpoint not yet available');
      return [];
    }
    console.error('❌ Failed to fetch warehouse restocks:', error);
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get warehouse sales
 */
export async function getWarehouseSales(warehouseId: string): Promise<WarehouseSale[]> {
  try {
    console.log('💰 WarehouseService: Fetching sales for warehouse:', warehouseId);
    const response = await apiClient.get<WarehouseSale[]>(
      `/api/warehouses/${warehouseId}/sales`
    );
    
    console.log('💰 Sales response type:', typeof response);
    
    const salesList = parseArrayResponse<WarehouseSale>(response, 'Sales API');
    console.log('✅ Loaded', salesList.length, 'sales');
    
    return salesList;
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Warehouse sales endpoint not yet available');
      return [];
    }
    console.error('❌ Failed to fetch warehouse sales:', error);
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
