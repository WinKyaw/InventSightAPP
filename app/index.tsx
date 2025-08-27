import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function IndexPage() {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return; // Still initializing, don't navigate yet
    }

    if (!hasNavigated) {
      const navigate = () => {
        if (isAuthenticated && user) {
          setHasNavigated(true);
          router.replace('/(tabs)/dashboard');
        } else {
          setHasNavigated(true);
          router.replace('/(auth)/login');
        }
      };

      const timer = setTimeout(navigate, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isLoading, isInitialized, hasNavigated, router]);

  useEffect(() => {
    if (hasNavigated) {
      setHasNavigated(false);
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