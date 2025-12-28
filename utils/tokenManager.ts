import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { AuthTokens, AuthUser, TOKEN_KEYS, JWTClaims } from '../types/auth';

/**
 * Secure Token Manager for handling JWT tokens and user data
 * Uses expo-secure-store for secure storage on device
 */
class TokenManager {
  private static instance: TokenManager;
  private clearingAuth: boolean = false;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store authentication tokens securely
   */
  async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken),
        SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        SecureStore.setItemAsync(
          TOKEN_KEYS.TOKEN_EXPIRY, 
          (Date.now() + tokens.expiresIn * 1000).toString()
        ),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Store user data securely
   */
  async storeUser(user: AuthUser): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Validate token structure and claims locally (silently)
   * Returns true if token is valid, false otherwise
   */
  private async validateTokenLocally(token: string): Promise<boolean> {
    try {
      const decoded = jwtDecode<JWTClaims>(token);
      
      // Check for required claims (silently)
      if (!decoded.tenant_id) {
        // Old token format - silently invalid
        return false;
      }

      if (!decoded.sub && !decoded.userId) {
        // Invalid token structure - silently invalid
        return false;
      }

      // Check expiration (silently)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        // Expired - silently invalid
        return false;
      }

      // Token is valid locally
      return true;
      
    } catch (decodeError) {
      // Malformed token - silently invalid
      return false;
    }
  }

  /**
   * Retrieve access token and validate it locally
   * Returns null for invalid tokens (silently clears them)
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
      
      if (!token) {
        return null;
      }

      // Validate token structure and claims
      const isValid = await this.validateTokenLocally(token);
      
      if (!isValid) {
        // Silently clear invalid token (with race condition protection)
        if (!this.clearingAuth) {
          await this.clearAuthData();
        }
        return null;
      }

      return token;
    } catch (error) {
      // Storage error - silently clear and return null
      if (!this.clearingAuth) {
        await this.clearAuthData();
      }
      return null;
    }
  }

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Retrieve user data
   */
  async getUser(): Promise<AuthUser | null> {
    try {
      const userData = await SecureStore.getItemAsync(TOKEN_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiryString = await SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY);
      if (!expiryString) return true;
      
      const expiry = parseInt(expiryString, 10);
      // Add 5 minute buffer for token refresh
      return Date.now() >= (expiry - 5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Get all stored authentication data
   */
  async getAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    isExpired: boolean;
  }> {
    try {
      const [accessToken, refreshToken, user, isExpired] = await Promise.all([
        this.getAccessToken(),
        this.getRefreshToken(),
        this.getUser(),
        this.isTokenExpired(),
      ]);

      return {
        accessToken,
        refreshToken,
        user,
        isExpired,
      };
    } catch (error) {
      console.error('Failed to get auth data:', error);
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        isExpired: true,
      };
    }
  }

  /**
   * Update only the access token (for refresh scenarios)
   */
  async updateAccessToken(accessToken: string, expiresIn: number): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(
          TOKEN_KEYS.TOKEN_EXPIRY,
          (Date.now() + expiresIn * 1000).toString()
        ),
      ]);
    } catch (error) {
      console.error('Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Clear all stored authentication data
   */
  async clearAuthData(): Promise<void> {
    // Prevent concurrent clearing operations
    if (this.clearingAuth) {
      return;
    }
    
    try {
      this.clearingAuth = true;
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(TOKEN_KEYS.USER_DATA),
        SecureStore.deleteItemAsync(TOKEN_KEYS.TOKEN_EXPIRY),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      // Don't throw error here as this is often called during logout
    } finally {
      this.clearingAuth = false;
    }
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { accessToken, refreshToken, isExpired } = await this.getAuthData();
      
      // Must have both tokens
      if (!accessToken || !refreshToken) {
        return false;
      }

      // If access token is expired but we have refresh token, user can be re-authenticated
      return true;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Get tenant/company ID from stored JWT token
   */
  async getCompanyId(): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      
      if (!token) {
        console.warn('⚠️ No access token found');
        return null;
      }

      const claims = jwtDecode<JWTClaims>(token);
      
      if (!claims) {
        console.error('❌ Failed to decode token claims');
        return null;
      }

      // Extract tenant_id from claims
      const companyId = claims.tenant_id || claims.tenantId;
      
      if (companyId) {
        console.log('✅ Extracted company ID from JWT:', companyId);
        return companyId;
      }

      console.warn('⚠️ No tenant_id found in JWT claims');
      return null;
    } catch (error) {
      console.error('❌ Error getting company ID:', error);
      return null;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();