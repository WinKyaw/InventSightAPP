import { Platform, Alert } from 'react-native';
import { getNetworkInfo, getApiBaseUrl } from './networkConfig';
import { API_CONFIG } from '../services/api/config';

/**
 * Network Diagnostics Helper
 * Provides easy-to-use debugging tools for network connectivity issues
 */

/**
 * Show a detailed network diagnostic alert
 * Useful for debugging network connectivity issues during development
 */
export const showNetworkDiagnostics = () => {
  const networkInfo = getNetworkInfo();
  const currentUrl = getApiBaseUrl();
  
  const diagnosticInfo = [
    `Platform: ${networkInfo.platform}`,
    `Device Type: ${networkInfo.isDevice ? 'Physical Device' : 'Simulator/Emulator'}`,
    `Current API URL: ${currentUrl}`,
    `Environment Override: ${networkInfo.environmentBaseUrl || 'None'}`,
    '',
    'Expected URLs:',
    `• Android Emulator: http://10.0.2.2:8080`,
    `• iOS Simulator: http://localhost:8080`,
    `• Physical Device: http://YOUR_IP:8080`,
    '',
    'Troubleshooting:',
    '1. Ensure backend is running on port 8080',
    '2. For physical devices, use your machine\'s IP',
    '3. Check firewall settings',
    '4. Verify network connectivity',
  ].join('\n');

  Alert.alert(
    'Network Diagnostics',
    diagnosticInfo,
    [
      {
        text: 'Copy URL',
        onPress: () => {
          // Note: In a real app, you'd use Clipboard.setString(currentUrl)
          console.log('Current API URL:', currentUrl);
        },
      },
      {
        text: 'OK',
        style: 'default',
      },
    ]
  );
};

/**
 * Log comprehensive network diagnostics to console
 * Useful for development and debugging
 */
export const logNetworkDiagnostics = () => {
  console.log('\n🔍 InventSightAPP Network Diagnostics');
  console.log('=====================================');
  
  const networkInfo = getNetworkInfo();
  
  console.log('📱 Platform Information:');
  console.log(`   OS: ${networkInfo.platform}`);
  console.log(`   Device: ${networkInfo.isDevice ? 'Physical Device' : 'Simulator/Emulator'}`);
  console.log(`   Android Emulator: ${networkInfo.isAndroidEmulator}`);
  console.log(`   iOS Simulator: ${networkInfo.isIOSSimulator}`);
  console.log(`   Development Mode: ${networkInfo.isDevelopment}`);
  
  console.log('\n🌐 API Configuration:');
  console.log(`   Detected URL: ${networkInfo.detectedBaseUrl}`);
  console.log(`   Environment Override: ${networkInfo.environmentBaseUrl || 'None'}`);
  console.log(`   Final URL: ${API_CONFIG.BASE_URL}`);
  console.log(`   Timeout: ${API_CONFIG.TIMEOUT}ms`);
  
  console.log('\n💡 Platform-Specific URLs:');
  console.log('   Android Emulator: http://10.0.2.2:8080');
  console.log('   iOS Simulator: http://localhost:8080');
  console.log('   Physical Device: http://YOUR_MACHINE_IP:8080');
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('   1. Verify backend is running: curl http://localhost:8080');
  console.log('   2. Check firewall allows port 8080');
  console.log('   3. For physical devices, ensure same network');
  console.log('   4. Set API_BASE_URL in .env if needed');
  
  console.log('=====================================\n');
  
  return networkInfo;
};

/**
 * Test API connectivity
 * Attempts a simple network request to verify connectivity
 */
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing API connectivity...');
    
    // Simple fetch test to the base URL with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ API connectivity test passed');
      return true;
    } else {
      console.log(`⚠️ API responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('❌ API connectivity test timed out');
      } else {
        console.log('❌ API connectivity test failed:', error.message);
      }
    } else {
      console.log('❌ API connectivity test failed:', String(error));
    }
    return false;
  }
};

/**
 * Get a summary of network configuration for display in UI
 */
export const getNetworkSummary = () => {
  const networkInfo = getNetworkInfo();
  
  return {
    platform: Platform.OS,
    deviceType: networkInfo.isDevice ? 'Physical Device' : 'Simulator',
    apiUrl: API_CONFIG.BASE_URL,
    hasEnvOverride: !!networkInfo.environmentBaseUrl,
  };
};