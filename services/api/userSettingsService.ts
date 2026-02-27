import { apiClient } from './apiClient';

export interface UserPreferences {
  currentStoreId?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  currency?: string;
}

export const UserSettingsService = {
  async getSettings(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences>('/api/users/settings');
      return response || {};
    } catch (error) {
      console.warn('⚠️ Could not load user settings:', error);
      return {};
    }
  },

  async saveCurrentStore(storeId: string): Promise<void> {
    try {
      await apiClient.put('/api/users/settings', { currentStoreId: storeId });
      console.log('✅ Saved current store preference:', storeId);
    } catch (error) {
      console.warn('⚠️ Could not save store preference to server:', error);
      // Fail silently — the store is still selected in-memory
    }
  },
};
