import React, { useState, useEffect } from 'react';
import { View, Text, Alert, SafeAreaView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { styles } from '../../constants/Styles';
import { validateLoginForm, getFieldError } from '../../utils/validation';
import { LoginCredentials } from '../../types/auth';

export default function LoginScreen() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isSubmitting, router]);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleLogin = async () => {
    try {
      // Validate form
      const validation = validateLoginForm(credentials);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        Alert.alert('Validation Error', 'Please correct the errors below');
        return;
      }

      setIsSubmitting(true);
      setValidationErrors([]);
      
      await login(credentials);
      
      // Success is handled by useEffect above
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const emailError = getFieldError(validationErrors, 'email');
  const passwordError = getFieldError(validationErrors, 'password');

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
              value={credentials.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
              error={emailError}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address"
            />
            
            <Input
              placeholder="Password"
              value={credentials.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              editable={!isSubmitting}
              error={passwordError}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
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