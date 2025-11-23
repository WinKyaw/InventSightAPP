import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BIOMETRIC_KEYS = {
  ENABLED: 'biometric.enabled',
  CREDENTIALS: 'biometric.credentials',
  USER_EMAIL: 'biometric.user_email',
};

interface BiometricCredentials {
  email: string;
  password: string;
}

/**
 * Biometric Authentication Service
 * Handles Face ID, Fingerprint, and other biometric authentication methods
 */
class BiometricService {
  private static instance: BiometricService;

  private constructor() {}

  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Validate SecureStore key format
   * Keys must only contain alphanumeric characters, ".", "-", and "_"
   */
  private isValidSecureStoreKey(key: string): boolean {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return false;
    }
    
    // Check for invalid characters (anything except alphanumeric, '.', '-', '_')
    const validKeyPattern = /^[a-zA-Z0-9._-]+$/;
    return validKeyPattern.test(key);
  }

  /**
   * Check if device supports biometric authentication
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  /**
   * Check if biometric records are enrolled on the device
   */
  async isEnrolled(): Promise<boolean> {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Failed to check biometric enrollment:', error);
      return false;
    }
  }

  /**
   * Get available biometric types on the device
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types;
    } catch (error) {
      console.error('Failed to get supported biometric types:', error);
      return [];
    }
  }

  /**
   * Get human-readable name for biometric type
   */
  getBiometricTypeName(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Iris';
      default:
        return 'Biometric';
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(
    promptMessage: string = 'Authenticate to continue'
  ): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  }

  /**
   * Check if biometric login is enabled for the app
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      // Check if key is valid before accessing SecureStore
      if (!this.isValidSecureStoreKey(BIOMETRIC_KEYS.ENABLED)) {
        console.warn('⚠️ BiometricService: Invalid ENABLED key');
        return false;
      }
      
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEYS.ENABLED);
      
      // For first-time users, enabled will be null
      if (enabled === null) {
        console.log('ℹ️ BiometricService: Biometric login not configured (first-time user)');
        return false;
      }
      
      return enabled === 'true';
    } catch (error) {
      console.error('❌ BiometricService: Failed to check biometric login status:', error);
      // Return false to skip biometric login on error
      return false;
    }
  }

  /**
   * Enable biometric login and store credentials
   */
  async enableBiometricLogin(email: string, password: string): Promise<void> {
    try {
      // Validate keys before using
      if (!this.isValidSecureStoreKey(BIOMETRIC_KEYS.ENABLED) ||
          !this.isValidSecureStoreKey(BIOMETRIC_KEYS.CREDENTIALS) ||
          !this.isValidSecureStoreKey(BIOMETRIC_KEYS.USER_EMAIL)) {
        throw new Error('Invalid SecureStore key configuration');
      }
      
      // First verify device supports biometrics
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      const enrolled = await this.isEnrolled();
      if (!enrolled) {
        throw new Error('No biometric data is enrolled on this device');
      }

      // Authenticate before storing credentials
      const result = await this.authenticate('Verify your identity to enable biometric login');
      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }

      // Store credentials securely
      const credentials: BiometricCredentials = { email, password };
      await Promise.all([
        SecureStore.setItemAsync(BIOMETRIC_KEYS.CREDENTIALS, JSON.stringify(credentials)),
        SecureStore.setItemAsync(BIOMETRIC_KEYS.ENABLED, 'true'),
        SecureStore.setItemAsync(BIOMETRIC_KEYS.USER_EMAIL, email),
      ]);

      console.log('✅ Biometric login enabled successfully');
    } catch (error) {
      console.error('Failed to enable biometric login:', error);
      throw error;
    }
  }

  /**
   * Disable biometric login and clear stored credentials
   */
  async disableBiometricLogin(): Promise<void> {
    try {
      // Validate keys before using
      if (!this.isValidSecureStoreKey(BIOMETRIC_KEYS.ENABLED) ||
          !this.isValidSecureStoreKey(BIOMETRIC_KEYS.CREDENTIALS) ||
          !this.isValidSecureStoreKey(BIOMETRIC_KEYS.USER_EMAIL)) {
        console.warn('⚠️ BiometricService: Invalid key configuration, skipping disable');
        return;
      }
      
      await Promise.all([
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.CREDENTIALS),
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.ENABLED),
        SecureStore.deleteItemAsync(BIOMETRIC_KEYS.USER_EMAIL),
      ]);

      console.log('✅ Biometric login disabled successfully');
    } catch (error) {
      console.error('Failed to disable biometric login:', error);
      // Don't throw error as we still want to continue
    }
  }

  /**
   * Get stored biometric credentials after successful authentication
   */
  async getStoredCredentials(): Promise<BiometricCredentials | null> {
    try {
      // Validate key before using
      if (!this.isValidSecureStoreKey(BIOMETRIC_KEYS.CREDENTIALS)) {
        console.warn('⚠️ BiometricService: Invalid CREDENTIALS key');
        return null;
      }
      
      // First check if biometric login is enabled
      const enabled = await this.isBiometricLoginEnabled();
      if (!enabled) {
        return null;
      }

      // Authenticate user
      const result = await this.authenticate('Login with biometrics');
      if (!result.success) {
        return null;
      }

      // Retrieve stored credentials
      const credentialsString = await SecureStore.getItemAsync(BIOMETRIC_KEYS.CREDENTIALS);
      if (!credentialsString) {
        return null;
      }

      const credentials: BiometricCredentials = JSON.parse(credentialsString);
      return credentials;
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return null;
    }
  }

  /**
   * Get stored user email (for display purposes)
   */
  async getStoredUserEmail(): Promise<string | null> {
    try {
      // Validate key before using
      if (!this.isValidSecureStoreKey(BIOMETRIC_KEYS.USER_EMAIL)) {
        console.warn('⚠️ BiometricService: Invalid USER_EMAIL key');
        return null;
      }
      
      const email = await SecureStore.getItemAsync(BIOMETRIC_KEYS.USER_EMAIL);
      return email;
    } catch (error) {
      console.error('Failed to get stored user email:', error);
      return null;
    }
  }

  /**
   * Check if biometric login is configured for a specific user
   */
  async isBiometricConfiguredForUser(email: string): Promise<boolean> {
    try {
      const enabled = await this.isBiometricLoginEnabled();
      if (!enabled) {
        return false;
      }

      const storedEmail = await this.getStoredUserEmail();
      return storedEmail?.toLowerCase() === email.toLowerCase();
    } catch (error) {
      console.error('Failed to check biometric configuration:', error);
      return false;
    }
  }

  /**
   * Clear biometric data when user logs out
   */
  async clearBiometricData(): Promise<void> {
    await this.disableBiometricLogin();
  }
}

// Export singleton instance
export const biometricService = BiometricService.getInstance();
