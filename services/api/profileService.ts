import { apiClient } from './apiClient';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  role: string;
  // Employee-specific
  employeeTitle?: string;
  department?: string;
  storeName?: string;
  companyName?: string;
}

export interface UpdateProfileRequest {
  email?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfileService = {

  async getMyProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>('/api/users/me');
      return response;
    } catch (error: any) {
      console.error('❌ ProfileService: Failed to get profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to load profile');
    }
  },

  async updateProfile(updates: UpdateProfileRequest): Promise<{ success: boolean; user: UserProfile; message: string }> {
    try {
      const response = await apiClient.put<{ success: boolean; user: UserProfile; message: string }>('/api/users/me', updates);
      return response;
    } catch (error: any) {
      console.error('❌ ProfileService: Failed to update profile:', error);
      if (error.response?.status === 409) {
        throw new Error('Email address is already in use by another account');
      }
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    try {
      // SECURITY: Never log the actual password values
      console.log('🔐 ProfileService: Changing password...');
      await apiClient.post('/api/users/me/change-password', request);
      console.log('✅ ProfileService: Password changed successfully');
    } catch (error: any) {
      console.error('❌ ProfileService: Failed to change password');
      if (error.response?.status === 401) {
        throw new Error('Current password is incorrect');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid password data');
      }
      throw new Error('Failed to change password');
    }
  },
};
