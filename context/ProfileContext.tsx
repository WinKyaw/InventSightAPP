import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { ProfileService, UserProfile, UpdateProfileRequest, ChangePasswordRequest, UpdateSettingsRequest } from '../services';
import { useApi } from '../hooks';

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  // Profile management
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
  uploadAvatar: (avatarFile: FormData) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  // Settings management
  updateSettings: (settings: UpdateSettingsRequest) => Promise<void>;
  // Data management
  refreshProfile: () => Promise<void>;
  getUserStats: () => Promise<{
    totalReceipts: number;
    totalRevenue: number;
    averageOrderValue: number;
    topProducts: Array<{ name: string; count: number; revenue: number }>;
    recentActivity: Array<{ action: string; timestamp: string; details: string }>;
  }>;
  getRecentActivity: (limit?: number) => Promise<Array<{
    id: number;
    action: string;
    timestamp: string;
    details: string;
    type: 'receipt' | 'inventory' | 'employee' | 'system';
  }>>;
  // Utility functions
  validatePassword: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // API integration using useApi hook
  const {
    data: apiProfile,
    loading,
    error,
    execute: fetchProfile,
    reset,
  } = useApi(ProfileService.getProfile, { immediate: true });

  // Effect to sync API data with local state
  useEffect(() => {
    if (apiProfile) {
      setProfile(apiProfile);
    }
  }, [apiProfile]);

  const updateProfile = async (updates: UpdateProfileRequest): Promise<void> => {
    try {
      const updatedProfile = await ProfileService.updateProfile(updates);
      setProfile(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
      throw error;
    }
  };

  const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      await ProfileService.changePassword(passwordData);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
      throw error;
    }
  };

  const uploadAvatar = async (avatarFile: FormData): Promise<void> => {
    try {
      const result = await ProfileService.uploadAvatar(avatarFile);
      if (profile) {
        setProfile({ ...profile, avatar: result.avatarUrl });
      }
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
      throw error;
    }
  };

  const deleteAvatar = async (): Promise<void> => {
    try {
      await ProfileService.deleteAvatar();
      if (profile) {
        setProfile({ ...profile, avatar: '' });
      }
      Alert.alert('Success', 'Profile picture deleted successfully');
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      Alert.alert('Error', 'Failed to delete profile picture. Please try again.');
      throw error;
    }
  };

  const updateSettings = async (settings: UpdateSettingsRequest): Promise<void> => {
    try {
      const updatedSettings = await ProfileService.updateSettings(settings);
      if (profile) {
        setProfile({ ...profile, settings: updatedSettings });
      }
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchProfile();
  };

  const getUserStats = async () => {
    try {
      return await ProfileService.getUserStats();
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalReceipts: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topProducts: [],
        recentActivity: [],
      };
    }
  };

  const getRecentActivity = async (limit: number = 10) => {
    try {
      return await ProfileService.getRecentActivity(limit);
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  };

  const validatePassword = async (password: string): Promise<boolean> => {
    try {
      return await ProfileService.validatePassword(password);
    } catch (error) {
      console.error('Failed to validate password:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear profile data
      setProfile(null);
      reset();
      
      // Would typically call logout API endpoint here
      // await AuthService.logout();
      
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      loading,
      error,
      updateProfile,
      changePassword,
      uploadAvatar,
      deleteAvatar,
      updateSettings,
      refreshProfile,
      getUserStats,
      getRecentActivity,
      validatePassword,
      logout,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}