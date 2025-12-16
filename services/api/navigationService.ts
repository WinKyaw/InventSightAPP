import { httpClient } from './httpClient';
import { API_CONFIG, API_ENDPOINTS } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NavigationPreferences {
  preferredTabs: string[];
  availableTabs: string[];
  modifiedAt: string;
  userId: string;
  username: string;
  role: string;
}

const CACHE_KEY = '@navigation_preferences';

class NavigationService {
  private getDefaultPreferences(): NavigationPreferences {
    // Default tabs match NavigationContext initial state: Items, Receipt, Team (employees key)
    return {
      preferredTabs: ['items', 'receipt', 'employees'],
      availableTabs: ['items', 'receipt', 'employees', 'calendar', 'reports', 'warehouse', 'setting'],
      modifiedAt: new Date().toISOString(),
      userId: '',
      username: '',
      role: 'USER'
    };
  }

  async getNavigationPreferences(forceRefresh = false): Promise<NavigationPreferences> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          console.log('📱 Using cached navigation preferences');
          return JSON.parse(cached);
        }
      }

      // Fetch from API
      console.log('📱 Fetching navigation preferences from API');
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER.NAVIGATION_PREFERENCES}`);
      
      const preferences = response.data;
      
      // Cache the response
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(preferences));
      console.log('✅ Navigation preferences cached:', preferences.preferredTabs);
      
      return preferences;
    } catch (error: any) {
      // ✅ Silently handle INVALID_TOKEN errors (user not logged in)
      // Check both message and potential variations for robustness
      if (error.message === 'INVALID_TOKEN' || error.message?.includes('INVALID_TOKEN')) {
        console.log('ℹ️ Navigation preferences not loaded: User not authenticated');
        return this.getDefaultPreferences();
      }
      
      // Only log other errors, don't throw
      console.error('❌ Error fetching navigation preferences:', error.message || error);
      return this.getDefaultPreferences();
    }
  }

  async updateNavigationPreferences(preferredTabs: string[]): Promise<void> {
    try {
      console.log('📱 Updating navigation preferences:', preferredTabs);
      
      const response = await httpClient.post(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.USER.NAVIGATION_PREFERENCES}`,
        { preferredTabs }
      );
      
      // Update cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      console.log('✅ Navigation preferences updated and cached');
    } catch (error: any) {
      console.error('❌ Error updating navigation preferences:', error);
      throw error;
    }
  }

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Navigation preferences cache cleared');
  }
}

export const navigationService = new NavigationService();
export type { NavigationPreferences };
