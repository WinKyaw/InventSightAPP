import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { UserProfile, UserSettings, UpdateProfileRequest, UpdateUserSettingsRequest } from '../types';
import { ProfileService } from '../services/api/profileService';
import { useApi, useApiWithParams } from '../hooks/useApi';

interface ProfileContextType {
  profile: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (profileData: UpdateProfileRequest) => Promise<void>;
  uploadProfileAvatar: (imageFile: FormData) => Promise<void>;
  fetchUserSettings: () => Promise<void>;
  updateUserSettings: (settings: UpdateUserSettingsRequest) => Promise<void>;
  clearProfile: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // API hooks for profile operations
  const {
    data: profileData,
    loading: fetchingProfile,
    error: profileError,
    execute: executeFetchProfile,
  } = useApi(() => ProfileService.getUserProfile());

  const {
    loading: updatingProfile,
    error: updateProfileError,
    execute: executeUpdateProfile,
  } = useApiWithParams((profileData: UpdateProfileRequest) => ProfileService.updateUserProfile(profileData));

  const {
    loading: uploadingAvatar,
    error: avatarError,
    execute: executeUploadAvatar,
  } = useApiWithParams((imageFile: FormData) => ProfileService.uploadProfileAvatar(imageFile));

  const {
    data: settingsData,
    loading: fetchingSettings,
    error: settingsError,
    execute: executeFetchSettings,
  } = useApi(() => ProfileService.getUserSettings());

  const {
    loading: updatingSettings,
    error: updateSettingsError,
    execute: executeUpdateSettings,
  } = useApiWithParams((settings: UpdateUserSettingsRequest) => ProfileService.updateUserSettings(settings));

  // Combine all loading states
  const loading = fetchingProfile || updatingProfile || uploadingAvatar || fetchingSettings || updatingSettings;
  
  // Combine all error states
  const error = profileError || updateProfileError || avatarError || settingsError || updateSettingsError;

  // Update local state when API data is fetched
  useEffect(() => {
    if (profileData) {
      setProfile(profileData);
    }
  }, [profileData]);

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData);
    }
  }, [settingsData]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      const fetchedProfile = await executeFetchProfile();
      if (fetchedProfile) {
        setProfile(fetchedProfile);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch user profile');
    }
  };

  const updateUserProfile = async (profileData: UpdateProfileRequest): Promise<void> => {
    try {
      const updatedProfile = await executeUpdateProfile(profileData);
      if (updatedProfile) {
        setProfile(updatedProfile);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const uploadProfileAvatar = async (imageFile: FormData): Promise<void> => {
    try {
      const updatedProfile = await executeUploadAvatar(imageFile);
      if (updatedProfile) {
        setProfile(updatedProfile);
        Alert.alert('Success', 'Profile picture updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
    }
  };

  const fetchUserSettings = async (): Promise<void> => {
    try {
      const fetchedSettings = await executeFetchSettings();
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch user settings');
    }
  };

  const updateUserSettings = async (settingsData: UpdateUserSettingsRequest): Promise<void> => {
    try {
      const updatedSettings = await executeUpdateSettings(settingsData);
      if (updatedSettings) {
        setSettings(updatedSettings);
        Alert.alert('Success', 'Settings updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const clearProfile = () => {
    setProfile(null);
    setSettings(null);
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      settings,
      loading,
      error,
      fetchUserProfile,
      updateUserProfile,
      uploadProfileAvatar,
      fetchUserSettings,
      updateUserSettings,
      clearProfile
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