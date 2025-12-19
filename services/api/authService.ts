import { 
  LoginCredentials, 
  SignupCredentials, 
  LoginResponse, 
  RefreshTokenResponse,
  AuthUser,
  AuthApiResponse 
} from '../../types/auth';
import { httpClient } from './httpClient';
import { API_ENDPOINTS, API_CONFIG } from './config';
import { tokenManager } from '../../utils/tokenManager';
import { navigationService } from './navigationService';

// Demo mode configuration
const DEMO_MODE = process.env.DEMO_MODE === 'true' || (process.env.NODE_ENV === 'development' && !process.env.API_BASE_URL);

// Mock data for demo mode
const DEMO_USERS = {
  'winkyaw@example.com': {
    id: '1',
    email: 'winkyaw@example.com',
    name: 'WinKyaw',
    role: 'admin',
  },
  'demo@example.com': {
    id: '2',
    email: 'demo@example.com',
    name: 'Demo User',
    role: 'user',
  },
};

const generateMockToken = (user: AuthUser) => ({
  accessToken: `mock_access_token_${user.id}_${Date.now()}`,
  refreshToken: `mock_refresh_token_${user.id}_${Date.now()}`,
  expiresIn: 3600, // 1 hour
  tokenType: 'Bearer',
});

const generateRandomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '_';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

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
    // ✅ SAFE: Log email only, NOT password
    console.log('🔐 AuthService: Attempting login for:', credentials.email);
    
    const fullUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
    console.log('🔗 Login API URL:', fullUrl);
    
    const response = await httpClient.post(
      fullUrl,
      {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password, // Send but don't log
      }
    );

    const apiResponse = response.data;
    // ✅ SECURITY FIX: Don't log response containing tokens
    // console.log('📥 Raw API Response:', apiResponse); // REMOVED - contains token!
    
    // Transform the API response to match expected LoginResponse format
    const loginData: LoginResponse = {
      user: {
        id: apiResponse.id.toString(),
        email: apiResponse.email,
        name: apiResponse.fullName,
        role: apiResponse.role.toLowerCase(),
        activeStoreId: apiResponse.activeStoreId,  // ✅ Include store ID if provided
        activeStoreName: apiResponse.activeStoreName,  // ✅ Include store name if provided
      },
      tokens: {
        accessToken: apiResponse.token,
        refreshToken: apiResponse.token, // Use same token if no separate refresh token
        expiresIn: apiResponse.expiresIn || 86400000,
        tokenType: apiResponse.tokenType || 'Bearer',
      },
      message: apiResponse.message,
    };
    
    // Store tokens and user data securely
    if (loginData.tokens) {
      await tokenManager.storeTokens(loginData.tokens);
      await tokenManager.storeUser(loginData.user);
    }

    // ✅ SAFE: Log only non-sensitive data
    console.log('✅ AuthService: Login successful for user:', loginData.user.email);
    console.log('  - User ID:', loginData.user.id);
    console.log('  - Role:', loginData.user.role);
    if (loginData.user.activeStoreId) {
      console.log('  - Active Store:', loginData.user.activeStoreName || loginData.user.activeStoreId);
    }
    // Do NOT log the token - it's sensitive!
    
    return loginData;
  } catch (error: any) {
    console.log('we are in the catch');
    // ✅ SAFE: Don't log credentials in error
    console.error('❌ AuthService: Login failed for:', credentials.email);
    
    // Network/connection errors
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot connect to InventSight backend server.\n\n' +
        'Please ensure:\n' +
        '1. Backend is running on port 8080\n' +
        '2. local-login is enabled in application.yml\n' +
        '3. You are on the same network\n\n' +
        'See BACKEND_SETUP.md for setup instructions.'
      );
    }
    
    // HTTP error responses
    if (error.response?.status === 401) {
      throw new Error(error.response.data?.message || 'Invalid email or password');
    } else if (error.response?.status === 404) {
      throw new Error(
        'Login endpoint not found.\n\n' +
        '⚠️ CRITICAL: Backend AuthController is likely DISABLED.\n\n' +
        'Fix: Edit backend application.yml and add:\n' +
        'inventsight:\n' +
        '  security:\n' +
        '    local-login:\n' +
        '      enabled: true\n\n' +
        'Then restart backend. See BACKEND_SETUP.md for details.'
      );
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
   * Mock login for demo mode
   */
  private async mockLogin(credentials: LoginCredentials): Promise<LoginResponse> {
    console.log('🔐 AuthService: Using demo mode for login');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = DEMO_USERS[credentials.email as keyof typeof DEMO_USERS];
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // For demo, accept any password with minimum 6 characters
    if (credentials.password.length < 6) {
      throw new Error('Invalid email or password');
    }
    
    const tokens = generateMockToken(user);
    
    // Store tokens and user data
    await tokenManager.storeTokens(tokens);
    await tokenManager.storeUser(user);
    
    console.log('✅ AuthService: Demo login successful for user:', user.email);
    
    return {
      user,
      tokens,
      message: 'Demo login successful',
    };
  }

  /**
   * Register new user
   */
  async signup(credentials: SignupCredentials): Promise<LoginResponse> {
    try {
      // ✅ SAFE: Log only non-sensitive fields
      console.log('🔐 AuthService: Attempting signup for:', credentials.email);
      
      const fullUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`;
      console.log('🔗 Signup API URL:', fullUrl);
      
      const response = await httpClient.post(
        fullUrl,
        {
          firstName: credentials.firstName.trim(),
          lastName: credentials.lastName.trim(),
          username: credentials.firstName.trim() + "." + credentials.lastName.trim() + generateRandomId(),
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password, // Send but don't log
        }
      );

      const apiResponse = response.data;
      // ✅ SECURITY FIX: Don't log response containing tokens
      // console.log('📥 Raw Signup API Response:', apiResponse); // REMOVED - contains token!
      
      // Transform the API response to match expected LoginResponse format
      // Backend returns user data at root level, not nested in "user" object
      const signupData: LoginResponse = {
        user: {
          id: apiResponse.id.toString(),
          email: apiResponse.email,
          name: apiResponse.fullName || `${credentials.firstName} ${credentials.lastName}`,
          role: apiResponse.role.toLowerCase(),
          activeStoreId: apiResponse.activeStoreId,  // ✅ Include store ID if provided
          activeStoreName: apiResponse.activeStoreName,  // ✅ Include store name if provided
        },
        tokens: {
          accessToken: apiResponse.token,
          refreshToken: apiResponse.token, // Use same token if no separate refresh token
          expiresIn: apiResponse.expiresIn || 86400000,
          tokenType: apiResponse.tokenType || 'Bearer',
        },
        message: apiResponse.message || 'Signup successful',
      };
      
      // Store tokens and user data securely
      if (signupData.tokens) {
        await tokenManager.storeTokens(signupData.tokens);
        await tokenManager.storeUser(signupData.user);
      }

      // ✅ SAFE: Log only non-sensitive data
      console.log('✅ AuthService: Signup successful for user:', signupData.user.email);
      console.log('  - User ID:', signupData.user.id);
      console.log('  - Role:', signupData.user.role);
      if (signupData.user.activeStoreId) {
        console.log('  - Active Store:', signupData.user.activeStoreName || signupData.user.activeStoreId);
      }
      // Do NOT log the token - it's sensitive!
      
      return signupData;
    } catch (error: any) {
      // ✅ SAFE: Don't log credentials in error
      console.error('❌ AuthService: Signup failed for:', credentials.email);
      
      // Network/connection errors
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
        throw new Error(
          'Cannot connect to InventSight backend server.\n\n' +
          'Please ensure:\n' +
          '1. Backend is running on port 8080\n' +
          '2. local-login is enabled in application.yml\n' +
          '3. You are on the same network\n\n' +
          'See BACKEND_SETUP.md for setup instructions.'
        );
      }
      
      // HTTP error responses
      if (error.response?.status === 409) {
        throw new Error('Email already exists. Please use a different email or login.');
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
   * Mock signup for demo mode
   */
  private async mockSignup(credentials: SignupCredentials): Promise<LoginResponse> {
    console.log('🔐 AuthService: Using demo mode for signup');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists in demo users
    if (DEMO_USERS[credentials.email as keyof typeof DEMO_USERS]) {
      throw new Error('An account with this email already exists');
    }
    
    // Create new mock user
    const user: AuthUser = {
      id: `demo_${Date.now()}`,
      email: credentials.email.toLowerCase().trim(),
      name: `${credentials.firstName.trim()} ${credentials.lastName.trim()}`,
      role: 'user',
    };
    
    const tokens = generateMockToken(user);
    
    // Store tokens and user data
    await tokenManager.storeTokens(tokens);
    await tokenManager.storeUser(user);
    
    console.log('✅ AuthService: Demo signup successful for user:', user.email);
    
    return {
      user,
      tokens,
      message: 'Demo signup successful',
    };
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
      
      // Clear navigation preferences cache
      await navigationService.clearCache();
      
      console.log('✅ AuthService: Logout successful');
    } catch (error) {
      console.error('❌ AuthService: Logout failed:', error);
      // Still clear local data even if server call fails
      await tokenManager.clearAuthData();
      await navigationService.clearCache();
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
   * ✅ SECURE: Never logs old or new passwords
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      // ✅ SAFE: Don't log passwords
      console.log('🔐 AuthService: Changing password');
      
      await httpClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        currentPassword, // Send but don't log
        newPassword,     // Send but don't log
      });
      
      console.log('✅ AuthService: Password changed successfully');
    } catch (error: any) {
      // ✅ SAFE: Don't log passwords in error
      console.error('❌ AuthService: Password change failed');
      
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
   * ✅ SECURITY FIX: Verifies token with backend server, not just local storage
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      // First check if we have a valid token locally (with silent validation)
      const accessToken = await tokenManager.getAccessToken();
      const refreshToken = await tokenManager.getRefreshToken();
      
      if (!accessToken || !refreshToken) {
        // No valid tokens found - silently return false
        return false;
      }

      // ✅ SECURITY FIX: Verify token with backend server
      try {
        // Make a lightweight API call to verify token validity
        const response = await httpClient.get(API_ENDPOINTS.AUTH.PROFILE);
        
        if (response.data) {
          // Token verified with server - silently return true
          return true;
        }
        
        return false;
      } catch (verifyError: any) {
        const status = verifyError.response?.status;
        
        // For 400/401, silently clear and return false (no logging)
        if (status === 400 || status === 401) {
          await tokenManager.clearAuthData();
          return false;
        }
        
        // For other errors, silently clear tokens and require re-login
        await tokenManager.clearAuthData();
        return false;
      }
    } catch (error) {
      // Authentication verification failed - silently clear and return false
      await tokenManager.clearAuthData();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();