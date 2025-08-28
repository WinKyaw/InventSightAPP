import { UserProfile, UserSettings, UpdateProfileRequest, UpdateUserSettingsRequest } from '../../types';
import { get, post, put } from './httpClient';
import { API_ENDPOINTS, ApiResponse } from './config';

export class ProfileService {
  /**
   * Get detailed user profile
   */
  static async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await get<UserProfile>(API_ENDPOINTS.PROFILE.USER);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await put<UserProfile>(API_ENDPOINTS.PROFILE.UPDATE, profileData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Upload profile avatar
   */
  static async uploadProfileAvatar(imageFile: FormData): Promise<UserProfile> {
    try {
      // For file uploads, we'll use a different approach
      const response = await fetch(`${API_ENDPOINTS.PROFILE.AVATAR}`, {
        method: 'POST',
        body: imageFile,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to upload profile avatar:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  static async getUserSettings(): Promise<UserSettings> {
    try {
      const response = await get<UserSettings>(API_ENDPOINTS.PROFILE.SETTINGS);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateUserSettings(settings: UpdateUserSettingsRequest): Promise<UserSettings> {
    try {
      const response = await put<UserSettings>(API_ENDPOINTS.PROFILE.UPDATE_SETTINGS, settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  }
}