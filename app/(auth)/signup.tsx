import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, StatusBar, TouchableOpacity, ScrollView, Animated, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { TermsCheckbox } from '../../components/ui/TermsCheckbox';
import { SignupSuccessScreen } from '../../components/ui/SignupSuccessScreen';
import { styles } from '../../constants/Styles';
import { validateSignupForm, getFieldError, validateEmail, validatePassword, validateFirstName, validateLastName, validatePasswordConfirmation, validateTermsAcceptance } from '../../utils/validation';
import { SignupCredentials } from '../../types/auth';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<SignupCredentials>({
    firstName: '',
    lastName: '',
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
  const lastNameInputRef = useRef<any>(null);
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
      case 'firstName':
        error = validateFirstName(credentials.firstName);
        break;
      case 'lastName':
        error = validateLastName(credentials.lastName);
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
        Alert.alert(t('errors.validationError'), t('errors.correctErrorsBelow'));
        return;
      }

      setIsSubmitting(true);
      setValidationErrors([]);

      await signup(credentials);
      
      // Show success screen
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = t('errors.signupFailed');
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('errors.signupFailed'), errorMessage, [{ text: t('common.ok') }]);
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
      case 'firstName':
        return !validateFirstName(credentials.firstName);
      case 'lastName':
        return !validateLastName(credentials.lastName);
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

  const firstNameError = hasFieldError('firstName');
  const lastNameError = hasFieldError('lastName');
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
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              <Text style={styles.subtitle}>{t('auth.joinUs')}</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Input
                placeholder={t('auth.firstName')}
                value={credentials.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                onBlur={() => handleInputBlur('firstName')}
                onSubmitEditing={() => lastNameInputRef.current?.focus()}
                returnKeyType="next"
                editable={!isSubmitting}
                error={firstNameError}
                success={isFieldValid('firstName')}
                accessibilityLabel="First name"
                accessibilityHint="Enter your first name"
              />
              
              <Input
                ref={lastNameInputRef}
                placeholder={t('auth.lastName')}
                value={credentials.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                onBlur={() => handleInputBlur('lastName')}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                returnKeyType="next"
                editable={!isSubmitting}
                error={lastNameError}
                success={isFieldValid('lastName')}
                accessibilityLabel="Last name"
                accessibilityHint="Enter your last name"
              />
              
              <Input
                ref={emailInputRef}
                placeholder={t('auth.email')}
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
                  placeholder={t('auth.password')}
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
                placeholder={t('auth.confirmPassword')}
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
                title={isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')} 
                onPress={handleSignUp} 
                color="#10B981" 
                disabled={isSubmitting}
                accessibilityLabel={isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
                accessibilityHint="Register a new account with the provided information"
                style={{ 
                  opacity: isSubmitting ? 0.7 : 1,
                  transform: [{ scale: isSubmitting ? 0.98 : 1 }],
                }}
              />
              
              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>{t('auth.alreadyHaveAccount')} </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/login')}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Go to sign in"
                  accessibilityHint="Navigate to the sign in screen"
                >
                  <Text style={[styles.link, { color: '#10B981' }]}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}