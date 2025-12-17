import axios from 'axios';
import { apiClient } from './apiClient';
import { WarehouseSummary, WarehouseInventoryRow, ProductAvailability } from '../../types/warehouse';

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
    
    // Handle different response formats
    const warehouseData = response?.data || response || [];
    
    // Ensure it's always an array
    if (Array.isArray(warehouseData)) {
      return warehouseData;
    } else {
      console.warn('⚠️ Unexpected warehouse response format:', warehouseData);
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
    return response || [];
  } catch (error) {
    console.error('Failed to fetch warehouse inventory:', error);
    throw error;
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

export const WarehouseService = {
  getWarehouses,
  getWarehouseInventory,
  getProductAvailability,
};

export default WarehouseService;
