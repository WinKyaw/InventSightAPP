import { 
  LoginCredentials, 
  SignupCredentials, 
  LoginResponse, 
  RefreshTokenResponse,
  AuthUser,
  AuthApiResponse 
} from '../../types/auth';
import { httpClient } from './httpClient';
import { API_ENDPOINTS } from './config';
import { tokenManager } from '../../utils/tokenManager';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 AuthService: Attempting login for:', credentials.email);
      
      const response = await httpClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }
      );

      const loginData = response.data;
      
      // Store tokens and user data securely
      if (loginData.tokens) {
        await tokenManager.storeTokens(loginData.tokens);
        await tokenManager.storeUser(loginData.user);
      }

      console.log('✅ AuthService: Login successful for user:', loginData.user.email);
      return loginData;
    } catch (error: any) {
      console.error('❌ AuthService: Login failed:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 429) {
        throw new Error('Too many login attempts. Please try again later');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please check your connection and try again');
      }
    }
  }

  /**
   * Register new user
   */
  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 AuthService: Attempting signup for:', credentials.email);
      
      const response = await httpClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.SIGNUP,
        {
          name: credentials.name.trim(),
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }
      );

      const signupData = response.data;
      
      // Store tokens and user data securely
      if (signupData.tokens) {
        await tokenManager.storeTokens(signupData.tokens);
        await tokenManager.storeUser(signupData.user);
      }

      console.log('✅ AuthService: Signup successful for user:', signupData.user.email);
      return signupData;
    } catch (error: any) {
      console.error('❌ AuthService: Signup failed:', error);
      
      if (error.response?.status === 409) {
        throw new Error('An account with this email already exists');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid signup data');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Signup failed. Please check your connection and try again');
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 AuthService: Refreshing access token');
      
      const response = await httpClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      const tokenData = response.data;
      
      // Update access token in secure storage
      await tokenManager.updateAccessToken(tokenData.accessToken, tokenData.expiresIn);

      console.log('✅ AuthService: Token refresh successful');
      return tokenData;
    } catch (error: any) {
      console.error('❌ AuthService: Token refresh failed:', error);
      
      // If refresh fails, clear all auth data
      await tokenManager.clearAuthData();
      
      throw new Error('Session expired. Please login again');
    }
  }

  /**
   * Logout user and clear all stored data
   */
  async logout(): Promise<void> {
    try {
      console.log('🔐 AuthService: Logging out user');
      
      // Try to notify server about logout (optional)
      try {
        const accessToken = await tokenManager.getAccessToken();
        if (accessToken) {
          await httpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        }
      } catch (logoutError) {
        // Ignore server logout errors - we'll clear local data anyway
        console.warn('⚠️ AuthService: Server logout notification failed:', logoutError);
      }
      
      // Clear all stored authentication data
      await tokenManager.clearAuthData();
      
      console.log('✅ AuthService: Logout successful');
    } catch (error) {
      console.error('❌ AuthService: Logout failed:', error);
      // Still clear local data even if server call fails
      await tokenManager.clearAuthData();
      throw new Error('Logout failed but local session cleared');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<AuthUser> {
    try {
      console.log('👤 AuthService: Fetching current user profile');
      
      const response = await httpClient.get<AuthUser>(API_ENDPOINTS.AUTH.PROFILE);
      const userData = response.data;
      
      // Update stored user data
      await tokenManager.storeUser(userData);
      
      console.log('✅ AuthService: User profile fetched successfully');
      return userData;
    } catch (error: any) {
      console.error('❌ AuthService: Failed to fetch user profile:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again');
      } else {
        throw new Error('Failed to fetch user profile');
      }
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    try {
      console.log('👤 AuthService: Updating user profile');
      
      const response = await httpClient.put<AuthUser>(
        API_ENDPOINTS.AUTH.PROFILE,
        updates
      );
      
      const updatedUser = response.data;
      
      // Update stored user data
      await tokenManager.storeUser(updatedUser);
      
      console.log('✅ AuthService: Profile updated successfully');
      return updatedUser;
    } catch (error: any) {
      console.error('❌ AuthService: Profile update failed:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid profile data');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again');
      } else {
        throw new Error('Failed to update profile');
      }
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('🔐 AuthService: Changing password');
      
      await httpClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      
      console.log('✅ AuthService: Password changed successfully');
    } catch (error: any) {
      console.error('❌ AuthService: Password change failed:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Current password is incorrect');
      } else if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again');
      } else {
        throw new Error('Failed to change password');
      }
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      console.log('🔐 AuthService: Requesting password reset for:', email);
      
      await httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.toLowerCase().trim(),
      });
      
      console.log('✅ AuthService: Password reset email sent');
    } catch (error: any) {
      console.error('❌ AuthService: Password reset request failed:', error);
      
      // Don't reveal if email exists or not for security
      if (error.response?.status === 404) {
        console.log('✅ AuthService: Password reset request processed (email may not exist)');
        return;
      }
      
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Verify if current stored authentication is valid
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      const { accessToken, refreshToken, isExpired } = await tokenManager.getAuthData();
      
      if (!accessToken || !refreshToken) {
        return false;
      }

      // If token is expired, try to refresh
      if (isExpired) {
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          console.error('❌ AuthService: Token refresh during verification failed:', refreshError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ AuthService: Authentication verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();