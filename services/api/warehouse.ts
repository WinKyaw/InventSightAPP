import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability, WarehouseRestock, WarehouseSale } from '../../types/warehouse';

/**
 * Warehouse API Service
 * Handles warehouse inventory and availability operations
 */

/**
 * Get list of all warehouses
 * Falls back to empty array if endpoint is not yet implemented
 */
export async function getWarehouses(): Promise<WarehouseSummary[]> {
  try {
    const response = await apiClient.get<WarehouseSummary[]>('/api/warehouses');
    
    // apiClient.get already extracts response.data, so response should be the data directly
    // Handle case where data might be wrapped in a data property, or is the array itself
    const warehouseData = (response as any)?.data ?? response;
    
    // Ensure it's always an array
    if (Array.isArray(warehouseData)) {
      return warehouseData;
    } else if (warehouseData === undefined || warehouseData === null) {
      console.warn('⚠️ Warehouse API returned null/undefined');
      return [];
    } else {
      console.warn('⚠️ Unexpected warehouse response format:', typeof warehouseData);
      return [];
    }
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Warehouses endpoint not yet available');
      return [];
    }
    console.error('Error fetching warehouses:', error);
    return []; // Always return empty array on error instead of throwing
  }
}

/**
 * Get inventory for a specific warehouse
 */
export async function getWarehouseInventory(warehouseId: string): Promise<WarehouseInventoryRow[]> {
  try {
    const response = await apiClient.get<WarehouseInventoryRow[]>(
      `/api/sales/inventory/warehouse/${warehouseId}`
    );
    
    // apiClient.get already extracts response.data, so response should be the data directly
    // Handle case where data might be wrapped in a data property, or is the array itself
    const inventoryData = (response as any)?.data ?? response;
    
    // Ensure it's always an array
    if (Array.isArray(inventoryData)) {
      return inventoryData;
    } else {
      console.warn('⚠️ Unexpected inventory response format:', typeof inventoryData);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch warehouse inventory:', error);
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
    const response = await apiClient.get<WarehouseRestock[]>(
      `/api/warehouses/${warehouseId}/restocks`
    );
    
    // Ensure it's always an array
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data: unknown }).data)) {
      return (response as { data: WarehouseRestock[] }).data;
    } else {
      console.warn('⚠️ Unexpected restock response format:', typeof response);
      return [];
    }
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Warehouse restocks endpoint not yet available');
      return [];
    }
    console.error('Failed to fetch warehouse restocks:', error);
    return []; // Return empty array on error instead of throwing
  }
}

/**
 * Get warehouse sales
 */
export async function getWarehouseSales(warehouseId: string): Promise<WarehouseSale[]> {
  try {
    const response = await apiClient.get<WarehouseSale[]>(
      `/api/warehouses/${warehouseId}/sales`
    );
    
    // Ensure it's always an array
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as { data: unknown }).data)) {
      return (response as { data: WarehouseSale[] }).data;
    } else {
      console.warn('⚠️ Unexpected sales response format:', typeof response);
      return [];
    }
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array gracefully
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn('Warehouse sales endpoint not yet available');
      return [];
    }
    console.error('Failed to fetch warehouse sales:', error);
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
