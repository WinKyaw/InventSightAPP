import React, { useEffect, ReactNode } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallbackRoute?: string;
}

/**
 * Protected Route Component
 * Handles authentication-based navigation guards
 */
export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  fallbackRoute = '/(auth)/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Still initializing, don't redirect yet
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (requireAuth && !isAuthenticated && !inAuthGroup) {
      // User needs to be authenticated but isn't, redirect to login
      console.log('🔐 ProtectedRoute: Redirecting unauthenticated user to login');
      router.replace(fallbackRoute as any);
    } else if (!requireAuth && isAuthenticated && inAuthGroup) {
      // User is authenticated but on auth pages, redirect to dashboard
      console.log('🔐 ProtectedRoute: Redirecting authenticated user to dashboard');
      router.replace('/(tabs)/dashboard');
    } else if (isAuthenticated && !inTabsGroup && !inAuthGroup) {
      // User is authenticated but not in tabs or auth, redirect to dashboard
      console.log('🔐 ProtectedRoute: Redirecting authenticated user to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, isInitialized, requireAuth, segments, router, fallbackRoute]);

  // Show loading spinner while auth is being initialized
  if (!isInitialized || isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: Colors.text,
          textAlign: 'center'
        }}>
          {isLoading ? 'Verifying authentication...' : 'Initializing...'}
        </Text>
        <Text style={{
          marginTop: 8,
          fontSize: 12,
          color: Colors.textSecondary || '#6B7280',
          textAlign: 'center'
        }}>
          Please wait while we prepare your secure session
        </Text>
      </View>
    );
  }

  // Check authentication requirements
  if (requireAuth && !isAuthenticated) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: Colors.text,
          textAlign: 'center'
        }}>
          Please wait...
        </Text>
      </View>
    );
  }

  if (!requireAuth && isAuthenticated) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: Colors.text,
          textAlign: 'center'
        }}>
          Redirecting...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Higher Order Component for protecting routes
 */
export function withProtectedRoute<T extends {}>(
  Component: React.ComponentType<T>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}