import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability, WarehouseRestock, WarehouseSale } from '../../types/warehouse';

/**
 * Warehouse API Service
 * Handles warehouse inventory and availability operations
 */

/**
 * Helper function to ensure API response is an array
 */
function ensureArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data: unknown }).data)) {
    return (response as { data: T[] }).data;
  } else {
    console.warn('⚠️ Unexpected API response format:', typeof response);
    return [];
  }
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
    
    // apiClient.get already extracts response.data, so response should be the data directly
    // Handle case where data might be wrapped in a data property, or is the array itself
    const warehouseData = (response as any)?.data ?? response;
    
    // Handle different response formats:
    // 1. Direct array: [...]
    // 2. Nested in data: { data: [...] }
    // 3. Paginated: { data: { content: [...] } }
    let warehouseList: WarehouseSummary[] = [];
    
    if (Array.isArray(warehouseData)) {
      // Direct array or nested array
      warehouseList = warehouseData;
    } else if (warehouseData && typeof warehouseData === 'object') {
      // Check for paginated response with content
      if (Array.isArray(warehouseData.content)) {
        warehouseList = warehouseData.content;
      } else {
        console.warn('⚠️ Unexpected warehouse response format:', typeof warehouseData);
        warehouseList = [];
      }
    } else if (warehouseData === undefined || warehouseData === null) {
      console.warn('⚠️ Warehouse API returned null/undefined');
      warehouseList = [];
    } else {
      console.warn('⚠️ Unexpected warehouse response format:', typeof warehouseData);
      warehouseList = [];
    }
    
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
    const response = await apiClient.get<WarehouseInventoryRow[]>(
      `/api/sales/inventory/warehouse/${warehouseId}`
    );
    
    console.log('📦 Inventory response type:', typeof response);
    
    // apiClient.get already extracts response.data, so response should be the data directly
    // Handle case where data might be wrapped in a data property, or is the array itself
    const inventoryData = (response as any)?.data ?? response;
    
    // Handle different response formats
    let inventoryList: WarehouseInventoryRow[] = [];
    
    if (Array.isArray(inventoryData)) {
      inventoryList = inventoryData;
    } else if (inventoryData && typeof inventoryData === 'object' && Array.isArray(inventoryData.content)) {
      inventoryList = inventoryData.content;
    } else {
      console.warn('⚠️ Unexpected inventory response format:', typeof inventoryData);
      inventoryList = [];
    }
    
    console.log('✅ Loaded', inventoryList.length, 'inventory items');
    return inventoryList;
  } catch (error) {
    console.error('❌ Failed to fetch warehouse inventory:', error);
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
    
    const restocksData = (response as any)?.data ?? response;
    let restocksList: WarehouseRestock[] = [];
    
    if (Array.isArray(restocksData)) {
      restocksList = restocksData;
    } else if (restocksData && typeof restocksData === 'object' && Array.isArray(restocksData.content)) {
      restocksList = restocksData.content;
    } else {
      console.warn('⚠️ Unexpected restocks response format:', typeof restocksData);
      restocksList = [];
    }
    
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
    
    const salesData = (response as any)?.data ?? response;
    let salesList: WarehouseSale[] = [];
    
    if (Array.isArray(salesData)) {
      salesList = salesData;
    } else if (salesData && typeof salesData === 'object' && Array.isArray(salesData.content)) {
      salesList = salesData.content;
    } else {
      console.warn('⚠️ Unexpected sales response format:', typeof salesData);
      salesList = [];
    }
    
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
