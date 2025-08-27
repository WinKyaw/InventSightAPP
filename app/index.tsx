import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function IndexPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasNavigated) {
      const navigate = () => {
        if (user) {
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
  }, [user, isLoading, hasNavigated, router]);

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