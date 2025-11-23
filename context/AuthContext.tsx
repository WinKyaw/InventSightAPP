import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
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

  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Initialize authentication state on app start
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      console.log('🔐 AuthContext: Initializing authentication...');
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // ✅ SECURITY FIX: Verify authentication with server (not just local storage)
      const isAuthenticated = await authService.verifyAuthentication();
      
      if (!isMountedRef.current) return;
      
      if (isAuthenticated) {
        // ✅ SECURITY FIX: Fetch fresh user data from server, don't trust cached data
        try {
          const user = await authService.getCurrentUser();
          
          if (user && isMountedRef.current) {
            console.log('✅ AuthContext: User authenticated and verified:', user.email);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              tokens: null,
            });
            return;
          }
        } catch (userError) {
          console.error('❌ AuthContext: Failed to fetch user after token verification:', userError);
          // Clear invalid state
          await authService.logout();
        }
      }

      // Authentication failed or user fetch failed
      if (isMountedRef.current) {
        console.log('🚫 AuthContext: Authentication failed - redirecting to login');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
      }
    } catch (error) {
      console.error('❌ AuthContext: Auth initialization failed:', error);
      if (isMountedRef.current) {
        // Clear any potentially invalid tokens
        await authService.logout();
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
      }
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 AuthContext: Attempting login...');
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const loginResponse = await authService.login(credentials);

      if (isMountedRef.current) {
        setAuthState({
          user: loginResponse.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });

        console.log('✅ AuthContext: Login successful');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      if (isMountedRef.current) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false,
          user: null 
        }));
      }
      throw error;
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      console.log('🔐 AuthContext: Attempting signup...');
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const signupResponse = await authService.signup(credentials);

      if (isMountedRef.current) {
        setAuthState({
          user: signupResponse.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });

        console.log('✅ AuthContext: Signup successful');
      }
    } catch (error) {
      console.error('❌ AuthContext: Signup failed:', error);
      if (isMountedRef.current) {
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          isAuthenticated: false,
          user: null 
        }));
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🔐 AuthContext: Logging out...');
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await authService.logout();

      if (isMountedRef.current) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });

        console.log('✅ AuthContext: Logout successful');
      }
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      // Even if server logout fails, clear local state
      if (isMountedRef.current) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      console.log('👤 AuthContext: Refreshing user data...');
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.getCurrentUser();
      
      if (isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));

        console.log('✅ AuthContext: User data refreshed');
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to refresh user data:', error);
      // If refresh fails due to authentication, logout
      if (error instanceof Error && error.message.includes('Session expired')) {
        await logout();
      }
      throw error;
    }
  }, [authState.isAuthenticated, logout]);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      console.log('👤 AuthContext: Updating profile...');
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.updateProfile(updates);
      
      if (isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));

        console.log('✅ AuthContext: Profile updated');
      }
    } catch (error) {
      console.error('❌ AuthContext: Failed to update profile:', error);
      throw error;
    }
  }, [authState.isAuthenticated]);

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