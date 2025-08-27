import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, SafeAreaView, StatusBar, TouchableOpacity, ScrollView, Animated, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { TermsCheckbox } from '../../components/ui/TermsCheckbox';
import { SignupSuccessScreen } from '../../components/ui/SignupSuccessScreen';
import { styles } from '../../constants/Styles';
import { validateSignupForm, getFieldError, validateEmail, validatePassword, validateName, validatePasswordConfirmation, validateTermsAcceptance } from '../../utils/validation';
import { SignupCredentials } from '../../types/auth';

export default function SignUpScreen() {
  const [credentials, setCredentials] = useState<SignupCredentials>({
    name: '',
    email: '', 
    password: '', 
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [fieldTouched, setFieldTouched] = useState<{[key: string]: boolean}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { signup } = useAuth();

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Input references for auto-focus
  const emailInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const confirmPasswordInputRef = useRef<any>(null);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInputChange = (field: keyof SignupCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleInputBlur = (field: keyof SignupCredentials) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Perform real-time validation for touched fields
    if (submitAttempted || fieldTouched[field]) {
      validateSingleField(field);
    }
  };

  const validateSingleField = (field: keyof SignupCredentials) => {
    let error = null;
    
    switch (field) {
      case 'name':
        error = validateName(credentials.name);
        break;
      case 'email':
        error = validateEmail(credentials.email);
        break;
      case 'password':
        error = validatePassword(credentials.password);
        break;
      case 'confirmPassword':
        error = validatePasswordConfirmation(credentials.password, credentials.confirmPassword || '');
        break;
      case 'acceptedTerms':
        error = validateTermsAcceptance(credentials.acceptedTerms || false);
        break;
    }

    if (error) {
      setValidationErrors(prev => {
        const filtered = prev.filter(e => e.field !== field);
        return [...filtered, error];
      });
    } else {
      setValidationErrors(prev => prev.filter(e => e.field !== field));
    }
  };

  const handleSignUp = async () => {
    try {
      setSubmitAttempted(true);
      
      // Validate form
      const validation = validateSignupForm(credentials);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        Alert.alert('Validation Error', 'Please correct the errors below and try again.');
        return;
      }

      setIsSubmitting(true);
      setValidationErrors([]);

      await signup(credentials);
      
      // Show success screen
      setShowSuccess(true);
      
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

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    // Navigation will be handled by auth context
  };

  // Helper function to check if field has error
  const hasFieldError = (field: string): string | null => {
    if ((submitAttempted || fieldTouched[field]) && getFieldError(validationErrors, field)) {
      return getFieldError(validationErrors, field);
    }
    return null;
  };

  // Helper function to check if field is valid (for success state)
  const isFieldValid = (field: keyof SignupCredentials): boolean => {
    if (!credentials[field] || (!submitAttempted && !fieldTouched[field])) return false;
    
    switch (field) {
      case 'name':
        return !validateName(credentials.name);
      case 'email':
        return !validateEmail(credentials.email);
      case 'password':
        return !validatePassword(credentials.password);
      case 'confirmPassword':
        return credentials.confirmPassword ? !validatePasswordConfirmation(credentials.password, credentials.confirmPassword) : false;
      default:
        return false;
    }
  };

  const nameError = hasFieldError('name');
  const emailError = hasFieldError('email');
  const passwordError = hasFieldError('password');
  const confirmPasswordError = hasFieldError('confirmPassword');
  const termsError = hasFieldError('acceptedTerms');

  if (showSuccess) {
    return (
      <SignupSuccessScreen
        userEmail={credentials.email}
        onContinue={handleSuccessContinue}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.loginContainer, { backgroundColor: '#10B981' }]}>
          <Animated.View 
            style={[
              styles.loginCard, 
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={[styles.logo, { backgroundColor: '#10B981' }]}>
                <Ionicons name="person-add" size={32} color="white" />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and start managing your inventory efficiently.</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Input
                placeholder="Full Name"
                value={credentials.name}
                onChangeText={(value) => handleInputChange('name', value)}
                onBlur={() => handleInputBlur('name')}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                returnKeyType="next"
                editable={!isSubmitting}
                error={nameError}
                success={isFieldValid('name')}
                accessibilityLabel="Full name"
                accessibilityHint="Enter your full name"
              />
              
              <Input
                ref={emailInputRef}
                placeholder="Email"
                value={credentials.email}
                onChangeText={(value) => handleInputChange('email', value)}
                onBlur={() => handleInputBlur('email')}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                editable={!isSubmitting}
                error={emailError}
                success={isFieldValid('email')}
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address"
              />
              
              <View>
                <Input
                  ref={passwordInputRef}
                  placeholder="Password"
                  value={credentials.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  onBlur={() => handleInputBlur('password')}
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  secureTextEntry
                  returnKeyType="next"
                  editable={!isSubmitting}
                  error={passwordError}
                  success={isFieldValid('password')}
                  showValidationIcon={!credentials.password}
                  accessibilityLabel="Password"
                  accessibilityHint="Enter a strong password"
                  containerStyle={{ marginBottom: 8 }}
                />
                <PasswordStrengthIndicator password={credentials.password} />
              </View>
              
              <Input
                ref={confirmPasswordInputRef}
                placeholder="Confirm Password"
                value={credentials.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                onBlur={() => handleInputBlur('confirmPassword')}
                onSubmitEditing={Keyboard.dismiss}
                secureTextEntry
                returnKeyType="done"
                editable={!isSubmitting}
                error={confirmPasswordError}
                success={isFieldValid('confirmPassword')}
                accessibilityLabel="Confirm password"
                accessibilityHint="Re-enter your password to confirm"
              />

              <TermsCheckbox
                checked={credentials.acceptedTerms || false}
                onToggle={() => handleInputChange('acceptedTerms', !credentials.acceptedTerms)}
                error={termsError}
              />
              
              <Button 
                title={isSubmitting ? "Creating Account..." : "Create Account"} 
                onPress={handleSignUp} 
                color="#10B981" 
                disabled={isSubmitting}
                accessibilityLabel={isSubmitting ? "Creating account, please wait" : "Create account"}
                accessibilityHint="Register a new account with the provided information"
                style={{ 
                  opacity: isSubmitting ? 0.7 : 1,
                  transform: [{ scale: isSubmitting ? 0.98 : 1 }],
                }}
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
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}