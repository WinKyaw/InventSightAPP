/**
 * Manual test to verify network configuration
 * This file can be used to test the network configuration changes
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApiBaseUrl, getNetworkInfo, API_BASE_URL_EXAMPLES } from '../utils/networkConfig';

// Test function to verify different scenarios
export const testNetworkConfiguration = () => {
  console.log('=== Testing Network Configuration ===');
  
  // Test 1: Current platform detection
  console.log('1. Current Platform Detection:');
  console.log(getNetworkInfo());
  console.log('Detected URL:', getApiBaseUrl());
  console.log('');
  
  // Test 2: Environment variable override
  console.log('2. Environment Variable Test:');
  const originalEnv = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'http://test-override.com:3000';
  console.log('With override:', getApiBaseUrl());
  process.env.API_BASE_URL = originalEnv; // Restore
  console.log('');
  
  // Test 3: Show available examples
  console.log('3. Available URL Examples:');
  Object.entries(API_BASE_URL_EXAMPLES).forEach(([scenario, url]) => {
    console.log(`   ${scenario}: ${url}`);
  });
  console.log('');
  
  console.log('✅ Network configuration test completed');
  
  return {
    currentUrl: getApiBaseUrl(),
    networkInfo: getNetworkInfo(),
    examples: API_BASE_URL_EXAMPLES,
  };
};

// Export for use in app development
export default testNetworkConfiguration;