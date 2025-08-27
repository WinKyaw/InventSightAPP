import React, { useState } from 'react';
import { View, Text, Alert, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { styles } from '../../constants/Styles';
import { validateSignupForm, getFieldError } from '../../utils/validation';
import { SignupCredentials } from '../../types/auth';

export default function SignUpScreen() {
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();

  const handleInputChange = (field: keyof SignupCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleSignUp = async () => {
    try {
      // Validate form
      const validation = validateSignupForm(credentials);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        Alert.alert('Validation Error', 'Please correct the errors below');
        return;
      }

      setIsSubmitting(true);
      setValidationErrors([]);

      await signup(credentials);
      
      // Success - navigation will be handled by auth context
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Signup Failed', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameError = getFieldError(validationErrors, 'name');
  const emailError = getFieldError(validationErrors, 'email');
  const passwordError = getFieldError(validationErrors, 'password');
  const confirmPasswordError = getFieldError(validationErrors, 'confirmPassword');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <View style={[styles.loginContainer, { backgroundColor: '#10B981' }]}>
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: '#10B981' }]}>
              <Ionicons name="person-add" size={32} color="white" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start managing your inventory.</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Input
              placeholder="Full Name"
              value={credentials.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={!isSubmitting}
              error={nameError}
              accessibilityLabel="Full name"
              accessibilityHint="Enter your full name"
            />
            
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
              accessibilityHint="Enter a strong password"
            />
            
            <Input
              placeholder="Confirm Password"
              value={credentials.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              editable={!isSubmitting}
              error={confirmPasswordError}
              accessibilityLabel="Confirm password"
              accessibilityHint="Re-enter your password to confirm"
            />
            
            <Button 
              title={isSubmitting ? "Creating Account..." : "Create Account"} 
              onPress={handleSignUp} 
              color="#10B981" 
              disabled={isSubmitting}
              accessibilityLabel={isSubmitting ? "Creating account, please wait" : "Create account"}
              accessibilityHint="Register a new account with the provided information"
            />
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/login')}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Go to sign in"
                accessibilityHint="Navigate to the sign in screen"
              >
                <Text style={[styles.link, { color: '#10B981' }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}