import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Network Configuration Utility
 * Handles React Native localhost connectivity issues by providing
 * platform-specific API base URLs for different deployment scenarios.
 */

/**
 * Get the machine's local IP address (fallback for development)
 * This is a simple implementation that works for common development scenarios.
 * For production, this should be replaced with the actual production URL.
 */
const getMachineIP = (): string => {
  // In a real implementation, you might want to detect the actual IP
  // For now, we'll use common development network ranges
  // This could be enhanced to actually detect the machine's IP if needed
  return '10.0.0.127'; // Common router IP range - should be configured per developer
};

/**
 * Determines if we're running in development mode
 */
const isDevelopment = (): boolean => {
  return __DEV__ || process.env.NODE_ENV === 'development';
};

/**
 * Determines if we're running on an Android emulator
 */
const isAndroidEmulator = (): boolean => {
  return Platform.OS === 'android' && Constants.isDevice === false;
};

/**
 * Determines if we're running on an iOS simulator
 */
const isIOSSimulator = (): boolean => {
  return Platform.OS === 'ios' && Constants.isDevice === false;
};

/**
 * Get the appropriate API base URL based on the platform and environment
 * 
 * @param port - The port number the backend is running on (default: 8080)
 * @param protocol - The protocol to use (default: 'http')
 * @returns The appropriate base URL for the current platform
 */
export const getApiBaseUrl = (port: number = 8080, protocol: string = 'http'): string => {
  // Always respect explicit environment variable first
  if (process.env.API_BASE_URL) {
    return protocol + "//" + process.env.API_BASE_URL + ":" + port;
  }

  // If not in development, use production URL or localhost
  if (!isDevelopment()) {
    return `${protocol}://localhost:${port}`;
  }

  // Development mode - choose based on platform
  if (isAndroidEmulator()) {
    // Android emulator - use special IP that maps to host machine
    return `${protocol}://10.0.2.2:${port}`;
  } else if (isIOSSimulator()) {
    // iOS Simulator - localhost works fine
    return `${protocol}://localhost:${port}`;
  } else {
    // Physical device or other scenarios - use machine IP
    // In a real app, you'd want to configure this per developer/network
    const machineIP = getMachineIP();
    return `${protocol}://${machineIP}:${port}`;
  }
};

/**
 * Get network configuration information for debugging
 */
export const getNetworkInfo = () => {
  return {
    platform: Platform.OS,
    isDevice: Constants.isDevice,
    isAndroidEmulator: isAndroidEmulator(),
    isIOSSimulator: isIOSSimulator(),
    isDevelopment: isDevelopment(),
    detectedBaseUrl: getApiBaseUrl(),
    environmentBaseUrl: process.env.API_BASE_URL,
  };
};

/**
 * Common API base URLs for different scenarios (for documentation/reference)
 */
export const API_BASE_URL_EXAMPLES = {
  ANDROID_EMULATOR: 'http://10.0.2.2:8080',
  IOS_SIMULATOR: 'http://localhost:8080',
  PHYSICAL_DEVICE_COMMON: 'http://10.0.0.127:8080', // Replace with your machine's IP
  PRODUCTION: 'https://your-api-domain.com',
  LOCALHOST: 'http://localhost:8080',
};