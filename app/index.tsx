import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function IndexPage() {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Still initializing, don't navigate yet
    }

    if (!hasNavigatedRef.current) {
      const navigate = () => {
        if (isAuthenticated && user) {
          hasNavigatedRef.current = true;
          router.replace('/(tabs)/dashboard');
        } else {
          hasNavigatedRef.current = true;
          router.replace('/(auth)/login');
        }
      };

      const timer = setTimeout(navigate, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoading, isInitialized]);

  useEffect(() => {
    // Reset navigation state when user email changes (user switches)
    if (hasNavigatedRef.current) {
      hasNavigatedRef.current = false;
    }
  }, [user?.email]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: Colors.background 
    }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}