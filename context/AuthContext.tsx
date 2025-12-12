import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { 
  AuthUser, 
  AuthState, 
  LoginCredentials, 
  SignupCredentials 
} from '../types/auth';
import { authService } from '../services/api/authService';
import { tokenManager } from '../utils/tokenManager';
import { responseCache } from '../utils/responseCache';
import { requestDeduplicator } from '../utils/requestDeduplicator';

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
  
  // Router and segments for navigation
  const router = useRouter();
  const segments = useSegments();
  
  // Check if we're on an auth screen
  const inAuthGroup = segments[0] === '(auth)';

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🔐 AuthContext State: isAuthenticated=${authState.isAuthenticated}, user=${authState.user?.email || 'null'}, loading=${authState.isLoading}`);
  }, [authState.isAuthenticated, authState.user, authState.isLoading]);

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
  }, []); // ✅ Empty array - runs only once on mount

  const initializeAuth = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      
      // Skip token verification if already on login page
      if (inAuthGroup) {
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            tokens: null,
          });
        }
        return;
      }
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Get stored token (this will auto-clear invalid ones via tokenManager)
      const token = await tokenManager.getAccessToken();
      
      if (!token) {
        // No valid token - silently redirect to login
        if (isMountedRef.current) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            tokens: null,
          });
          router.replace('/(auth)/login');
        }
        return;
      }

      // Verify authentication with server
      const isAuthenticated = await authService.verifyAuthentication();
      
      if (!isMountedRef.current) return;
      
      if (isAuthenticated) {
        // Fetch fresh user data from server
        try {
          const user = await authService.getCurrentUser();
          
          if (user && isMountedRef.current) {
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
              tokens: null,
            });
            return;
          }
        } catch (userError: any) {
          const status = userError.response?.status;
          
          // Silently clear and redirect for auth errors
          if (status === 400 || status === 401) {
            await tokenManager.clearAuthData();
            if (isMountedRef.current) {
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
                tokens: null,
              });
              router.replace('/(auth)/login');
            }
            return;
          }
          
          // For other errors, also clear and redirect but log for debugging
          console.warn('⚠️ Auth: Failed to fetch user (network issue?)');
          await tokenManager.clearAuthData();
        }
      }

      // Authentication failed - silently redirect to login
      if (isMountedRef.current) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
        router.replace('/(auth)/login');
      }
    } catch (error: any) {
      const status = error.response?.status;
      
      if (isMountedRef.current) {
        // Silently handle auth errors (400/401)
        if (status === 400 || status === 401) {
          await tokenManager.clearAuthData();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            tokens: null,
          });
          router.replace('/(auth)/login');
        } else {
          // Network or other error - still redirect but log for debugging
          console.warn('⚠️ Auth initialization failed (network issue?)');
          await tokenManager.clearAuthData();
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
            tokens: null,
          });
          router.replace('/(auth)/login');
        }
      }
    }
  }, [router]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      if (!isMountedRef.current) return;
      
      console.log('🔐 AuthContext: Starting login...');
      setAuthState(prev => ({ ...prev, isLoading: true }));

      console.log('🔐 AuthContext: Calling login API...');
      const loginResponse = await authService.login(credentials);
      console.log('✅ AuthContext: Login API successful');

      if (isMountedRef.current) {
        // ✅ FIX: Update state IMMEDIATELY and SYNCHRONOUSLY
        // Set isAuthenticated to true right after tokens are stored
        setAuthState({
          user: loginResponse.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
        console.log('✅ AuthContext: isAuthenticated set to TRUE');

        // ⏱️ Wait for React Context to propagate state to all subscribers
        // React state updates are asynchronous, and Expo Router navigation is immediate.
        // Without this delay, TabsLayout may briefly see the old state and redirect back to login.
        // This is a known pattern in React Native apps using Context + Router.
        // Increased from 100ms to 150ms for React 19 batching
        await new Promise(resolve => setTimeout(resolve, 150));
        console.log('✅ AuthContext: State propagated, navigating...');

        // Then navigate to main app
        router.replace('/(tabs)/dashboard');
        console.log('✅ AuthContext: Navigation triggered');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      // Login errors should be shown (user needs to know)
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
  }, [router]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const signupResponse = await authService.signup(credentials);

      if (isMountedRef.current) {
        // Update state FIRST - set isAuthenticated before navigation
        setAuthState({
          user: signupResponse.user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });

        // ⏱️ Wait for React Context to propagate state to all subscribers
        // React state updates are asynchronous, and Expo Router navigation is immediate.
        // Without this delay, TabsLayout may briefly see the old state and redirect back to login.
        // This is a known pattern in React Native apps using Context + Router.
        await new Promise(resolve => setTimeout(resolve, 100));

        // Then navigate to main app
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      // Signup errors should be shown (user needs to know)
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
  }, [router]);

  const logout = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await authService.logout();

      if (isMountedRef.current) {
        // Clear all caches and pending requests
        responseCache.clear();
        requestDeduplicator.clear();
        console.log('✅ Caches cleared on logout');
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });

        // Navigate to login
        router.replace('/(auth)/login');
      }
    } catch (error) {
      // Even if server logout fails, clear local state
      if (isMountedRef.current) {
        // Clear all caches and pending requests
        responseCache.clear();
        requestDeduplicator.clear();
        console.log('✅ Caches cleared on logout (after error)');
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
          tokens: null,
        });
        
        // Navigate to login
        router.replace('/(auth)/login');
      }
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.getCurrentUser();
      
      if (isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error: any) {
      const status = error.response?.status;
      
      // If refresh fails due to authentication, logout silently
      if (status === 400 || status === 401) {
        await logout();
      } else {
        console.warn('⚠️ Auth: Failed to refresh user data');
      }
      throw error;
    }
  }, [authState.isAuthenticated, logout]);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      if (!authState.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.updateProfile(updates);
      
      if (isMountedRef.current) {
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error) {
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