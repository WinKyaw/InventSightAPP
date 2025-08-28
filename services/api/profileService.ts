import { get, post, put, del } from './httpClient';
import { 
  API_ENDPOINTS, 
  UserProfile, 
  UpdateProfileRequest, 
  ChangePasswordRequest, 
  UpdateSettingsRequest,
  ApiResponse 
} from './config';

export class ProfileService {
  /**
   * Get current user profile
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await get<UserProfile>(API_ENDPOINTS.PROFILE.GET);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await put<UserProfile>(API_ENDPOINTS.PROFILE.UPDATE, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    try {
      await post(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, passwordData);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Upload profile avatar
   */
  static async uploadAvatar(avatarFile: FormData): Promise<{ avatarUrl: string }> {
    try {
      const response = await post<{ avatarUrl: string }>(API_ENDPOINTS.PROFILE.UPLOAD_AVATAR, avatarFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  /**
   * Delete profile avatar
   */
  static async deleteAvatar(): Promise<void> {
    try {
      await del(API_ENDPOINTS.PROFILE.DELETE_AVATAR);
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  static async getSettings(): Promise<UserProfile['settings']> {
    try {
      const response = await get<UserProfile['settings']>(API_ENDPOINTS.PROFILE.SETTINGS);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Return default settings if API fails
      return {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        notifications: {
          email: true,
          push: true,
          sms: false,
          lowStock: true,
          orderUpdates: true,
          reminders: true,
        },
        theme: 'light',
      };
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(settings: UpdateSettingsRequest): Promise<UserProfile['settings']> {
    try {
      const response = await put<UserProfile['settings']>(API_ENDPOINTS.PROFILE.UPDATE_SETTINGS, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Get user statistics/dashboard data
   */
  static async getUserStats(): Promise<{
    totalReceipts: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; count: number; revenue: number }>;
    recentActivity: Array<{ action: string; timestamp: string; details: string }>;
  }> {
    try {
      // This would typically be a separate endpoint
      const profile = await this.getProfile();
      
      // For now, return mock data - would be replaced with actual API call
      return {
        totalReceipts: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        recentActivity: [],
      };
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return {
        totalReceipts: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        recentActivity: [],
      };
    }
  }

  /**
   * Get user's recent activity
   */
  static async getRecentActivity(limit: number = 10): Promise<Array<{
    id: number;
    action: string;
    timestamp: string;
    details: string;
    type: 'receipt' | 'inventory' | 'employee' | 'system';
  }>> {
    try {
      // This would be a separate endpoint in a real API
      const params = new URLSearchParams({ limit: limit.toString() });
      
      // For now, return empty array - would be replaced with actual API call
      return [];
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }
  }

  /**
   * Validate current password (for sensitive operations)
   */
  static async validatePassword(password: string): Promise<boolean> {
    try {
      const response = await post<{ valid: boolean }>('/api/profile/validate-password', { password });
      return response.data.valid;
    } catch (error) {
      console.error('Failed to validate password:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA (if implemented)
   */
  static async generateBackupCodes(): Promise<string[]> {
    try {
      const response = await post<{ codes: string[] }>('/api/profile/backup-codes');
      return response.data.codes;
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
      return [];
    }
  }

  /**
   * Enable/disable 2FA
   */
  static async toggle2FA(enable: boolean, password?: string): Promise<{ enabled: boolean; qrCode?: string }> {
    try {
      const response = await post<{ enabled: boolean; qrCode?: string }>('/api/profile/2fa', { 
        enable, 
        password 
      });
      return response.data;
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      throw error;
    }
  }

  /**
   * Get default profile data (for offline/fallback use)
   */
  static getDefaultProfile(): UserProfile {
    return {
      id: 0,
      firstName: 'User',
      lastName: 'Name',
      email: 'user@example.com',
      phone: '',
      role: 'user',
      department: '',
      avatar: '',
      settings: {
        language: 'en',
        timezone: 'UTC',
        currency: 'USD',
        notifications: {
          email: true,
          push: true,
          sms: false,
          lowStock: true,
          orderUpdates: true,
          reminders: true,
        },
        theme: 'light',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export default ProfileService;