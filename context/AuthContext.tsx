import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  AuthUser, 
  AuthState, 
  LoginCredentials, 
  SignupCredentials 
} from '../types/auth';
import { authService } from '../services/api/authService';
import { tokenManager } from '../utils/tokenManager';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the context for potential direct use
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    tokens: null,
  });

  /**
   * Initialize authentication state on app start
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 AuthContext: Initializing authentication...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Check if user has valid authentication
      const isAuthenticated = await authService.verifyAuthentication();
      
      if (isAuthenticated) {
        // Get stored user data
        const user = await tokenManager.getUser();
        if (user) {
          console.log('✅ AuthContext: User authenticated:', user.email);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            tokens: null, // We don't need to expose tokens in context
          });
          return;
        }
      }

      console.log('ℹ️ AuthContext: No valid authentication found');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });
    } catch (error) {
      console.error('❌ AuthContext: Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 AuthContext: Attempting login...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const loginResponse = await authService.login(credentials);

      setAuthState({
        user: loginResponse.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });

      console.log('✅ AuthContext: Login successful');
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      }));
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      console.log('🔐 AuthContext: Attempting signup...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const signupResponse = await authService.signup(credentials);

      setAuthState({
        user: signupResponse.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });

      console.log('✅ AuthContext: Signup successful');
    } catch (error) {
      console.error('❌ AuthContext: Signup failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        isAuthenticated: false,
        user: null 
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🔐 AuthContext: Logging out...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await authService.logout();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });

      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      // Even if server logout fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        tokens: null,
      });
    }
  };

  const refreshUser = async () => {
    try {
      console.log('👤 AuthContext: Refreshing user data...');
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.getCurrentUser();
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      console.log('✅ AuthContext: User data refreshed');
    } catch (error) {
      console.error('❌ AuthContext: Failed to refresh user data:', error);
      // If refresh fails due to authentication, logout
      if (error instanceof Error && error.message.includes('Session expired')) {
        await logout();
      }
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      console.log('👤 AuthContext: Updating profile...');
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.updateProfile(updates);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      console.log('✅ AuthContext: Profile updated');
    } catch (error) {
      console.error('❌ AuthContext: Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user: authState.user,
        isAuthenticated: authState.isAuthenticated,
        isLoading: authState.isLoading,
        isInitialized: authState.isInitialized,
        login, 
        signup, 
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}