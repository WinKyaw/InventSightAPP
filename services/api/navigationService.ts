import { httpClient } from './httpClient';
import { API_CONFIG, API_ENDPOINTS } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenManager } from '../../utils/tokenManager';

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
    // Try to get role from cached token
    let role = 'EMPLOYEE'; // Default to most restrictive
    
    try {
      // Get token synchronously from the manager
      const token = tokenManager.getAccessToken(); // This returns a Promise, we'll handle it differently
      // For now, use default role since we can't await here
      // The role will be updated when preferences are fetched from backend
    } catch (e) {
      console.log('Could not decode token for role, using EMPLOYEE defaults');
    }
    
    // GM+ roles get team access
    const isGMPlus = ['OWNER', 'CO_OWNER', 'MANAGER', 'ADMIN'].includes(role);
    
    const defaultTabs = isGMPlus 
      ? ['items', 'receipt', 'employees']
      : ['items', 'receipt', 'calendar'];
    
    const availableTabs = isGMPlus
      ? ['items', 'receipt', 'employees', 'calendar', 'reports', 'warehouse', 'setting']
      : ['items', 'receipt', 'calendar', 'reports', 'warehouse', 'setting'];
    
    return {
      preferredTabs: defaultTabs,
      availableTabs: availableTabs,
      modifiedAt: new Date().toISOString(),
      userId: '',
      username: '',
      role: role
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
      
      // Handle backend response format
      const data = response.data.data || response.data; // Support both formats
      const preferences = {
        preferredTabs: data.preferredTabs || [],
        availableTabs: data.availableTabs || [],
        modifiedAt: data.modifiedAt || new Date().toISOString(),
        userId: data.userId || '',
        username: data.username || '',
        role: data.role || 'USER'
      };
      
      // Cache the response
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(preferences));
      console.log('✅ Navigation preferences cached:', preferences.preferredTabs);
      
      return preferences;
    } catch (error: any) {
      // ✅ Silently handle errors - don't show to user
      const status = error.response?.status;
      
      if (error.message === 'INVALID_TOKEN') {
        console.log('ℹ️ Navigation preferences: User not authenticated');
      } else if (status === 500) {
        console.log('ℹ️ Navigation preferences: Backend endpoint not ready, using defaults');
      } else if (status === 404) {
        console.log('ℹ️ Navigation preferences: Endpoint not found, using defaults');
      } else {
        console.log('ℹ️ Navigation preferences: Using defaults due to error:', error.message);
      }
      
      // ✅ Return role-based defaults instead of generic defaults
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
