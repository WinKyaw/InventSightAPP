import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { styles } from '../../constants/Styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isSubmitting) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, isSubmitting, router]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(email.trim(), password.trim());
    } catch (error) {
      Alert.alert(
        'Login Failed', 
        error instanceof Error ? error.message : 'Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.loginContainer}
      >
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="cube" size={32} color="white" />
            </View>
            <Text style={styles.title}>Point of Sale</Text>
            <Text style={styles.subtitle}>Welcome back! Please sign in.</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
            
            <Button 
              title={isSubmitting ? "Signing In..." : "Sign In"} 
              onPress={handleLogin} 
              disabled={isSubmitting}
            />
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/signup')}
                disabled={isSubmitting}
              >
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}