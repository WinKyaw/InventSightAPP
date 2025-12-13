import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './config';

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
    } catch (error: any) {
      console.error('❌ Failed to fetch stores:', error);
      return [];
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
    } catch (error: any) {
      console.error(`❌ Failed to fetch store ${id}:`, error);
      return null;
    }
  }
}
