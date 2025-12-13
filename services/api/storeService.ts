import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './config';
import axios from 'axios';

export interface Store {
  id: string;
  storeName: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface StoresResponse {
  success: boolean;
  message: string;
  stores: Store[];
  count: number;
}

export class StoreService {
  /**
   * Get all stores for authenticated user
   */
  static async getUserStores(): Promise<Store[]> {
    try {
      const response = await apiClient.get<StoresResponse>(
        API_ENDPOINTS.STORES.ALL
      );
      return response.stores;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log('📭 No stores found - returning empty array');
        return [];
      }
      console.error('❌ Failed to fetch stores:', error);
      throw error;
    }
  }

  /**
   * Get specific store by ID
   */
  static async getStore(id: string): Promise<Store | null> {
    try {
      const response = await apiClient.get<{ success: boolean; store: Store }>(
        API_ENDPOINTS.STORES.BY_ID(id)
      );
      return response.store;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`📭 Store ${id} not found`);
        return null;
      }
      console.error(`❌ Failed to fetch store ${id}:`, error);
      throw error;
    }
  }
}
