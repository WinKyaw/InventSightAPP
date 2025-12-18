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
    // Default to EMPLOYEE role for most restrictive access
    // Role will be properly set when preferences are fetched from backend
    // EMPLOYEE users get calendar instead of team by default
    return {
      preferredTabs: ['items', 'receipt', 'calendar'],
      availableTabs: ['items', 'receipt', 'calendar', 'reports', 'warehouse', 'setting', 'employees'],
      modifiedAt: new Date().toISOString(),
      userId: '',
      username: '',
      role: 'EMPLOYEE'
    };
  }

  async getNavigationPreferences(forceRefresh = false): Promise<NavigationPreferences> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const prefs = JSON.parse(cached);
          console.log('📱 Using cached navigation preferences:', prefs.preferredTabs);
          return prefs;
        }
      }

      // Fetch from API
      console.log('📱 Fetching navigation preferences from API...');
      const response = await httpClient.get(API_ENDPOINTS.USER.NAVIGATION_PREFERENCES);
      
      console.log('📥 API Response:', JSON.stringify(response.data, null, 2));
      
      // Handle backend response format
      const data = response.data.data || response.data; // Support both formats
      const defaults = this.getDefaultPreferences();
      const preferences = {
        preferredTabs: data.preferredTabs ?? defaults.preferredTabs,
        availableTabs: data.availableTabs ?? defaults.availableTabs,
        modifiedAt: data.modifiedAt ?? new Date().toISOString(),
        userId: data.userId ?? '',
        username: data.username ?? '',
        role: data.role ?? defaults.role
      };
      
      console.log('✅ Navigation preferences cached:', preferences.preferredTabs);
      console.log('✅ Available tabs:', preferences.availableTabs);
      
      // ✅ Check if team is included
      if (preferences.preferredTabs.includes('employees') || preferences.preferredTabs.includes('team')) {
        console.log('✅ Team access GRANTED in preferredTabs!');
      } else {
        console.log('ℹ️ Team access not in preferredTabs');
      }
      
      if (preferences.availableTabs.includes('employees') || preferences.availableTabs.includes('team')) {
        console.log('✅ Team access available in availableTabs!');
      } else {
        console.log('ℹ️ Team access not in availableTabs');
      }
      
      // Cache the response
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(preferences));
      
      return preferences;
    } catch (error: any) {
      // ✅ Silently handle errors - don't show to user
      const status = error.response?.status;
      let errorType = 'error';
      
      if (error.message === 'INVALID_TOKEN') {
        errorType = 'not authenticated';
      } else if (status === 500) {
        errorType = 'backend endpoint not ready';
      } else if (status === 404) {
        errorType = 'endpoint not found';
      } else if (error.message?.trim()) {
        errorType = `error: ${error.message}`;
      }
      
      console.log(`ℹ️ Navigation preferences: ${errorType}, using defaults`);
      
      // ✅ Return safe defaults (EMPLOYEE role with calendar)
      return this.getDefaultPreferences();
    }
  }

  async updateNavigationPreferences(preferredTabs: string[]): Promise<void> {
    try {
      console.log('📱 Updating navigation preferences:', preferredTabs);
      
      const response = await httpClient.post(
        API_ENDPOINTS.USER.NAVIGATION_PREFERENCES,
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
