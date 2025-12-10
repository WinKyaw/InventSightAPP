import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DemoInfo } from '../../components/ui/DemoInfo';
import { styles } from '../../constants/Styles';
import { validateLoginForm, getFieldError } from '../../utils/validation';
import { LoginCredentials } from '../../types/auth';
import { biometricService } from '../../services/biometricService';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [checkingBiometric, setCheckingBiometric] = useState(true);
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

  // Check biometric availability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setCheckingBiometric(true);

      // ✅ FIX: First check if biometric login is enabled (silent check)
      const enabled = await biometricService.isBiometricLoginEnabled();
      
      if (!enabled) {
        // User hasn't enabled biometric login - skip all checks
        console.log('ℹ️ Login: Biometric login not enabled, skipping checks');
        setBiometricAvailable(false);
        setBiometricEnabled(false);
        setCheckingBiometric(false);
        return;
      }
      
      // Only proceed with hardware checks if biometric is enabled
      const available = await biometricService.isAvailable();
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);

      if (available && enabled) {
        // Get stored email to pre-fill
        const storedEmail = await biometricService.getStoredUserEmail();
        if (storedEmail) {
          setCredentials(prev => ({ ...prev, email: storedEmail }));
        }

        // Get biometric type for display
        const types = await biometricService.getSupportedTypes();
        if (types.length > 0) {
          const typeName = biometricService.getBiometricTypeName(types[0]);
          setBiometricType(typeName);
        }
      }

      setCheckingBiometric(false);
    } catch (error) {
      console.error('❌ Login: Failed to check biometric availability:', error);
      setCheckingBiometric(false);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsSubmitting(true);

      // Get stored credentials with biometric authentication
      const storedCredentials = await biometricService.getStoredCredentials();

      if (!storedCredentials) {
        Alert.alert(
          t('errors.authenticationFailed'),
          t('errors.couldNotRetrieveCredentials'),
          [{ text: t('common.ok') }]
        );
        setIsSubmitting(false);
        return;
      }

      // Login with stored credentials
      await login(storedCredentials);

      // Success is handled by useEffect above
    } catch (error: any) {
      console.error('Biometric login error:', error);
      
      Alert.alert(
        t('errors.biometricLoginFailed'),
        t('errors.pleaseLoginWithPassword'),
        [{ text: t('common.ok') }]
      );
      setIsSubmitting(false);
    }
  };

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
        Alert.alert(t('errors.validationError'), t('errors.correctErrorsBelow'));
        return;
      }

      setIsSubmitting(true);
      setValidationErrors([]);
      
      await login(credentials);
      
      // Success is handled by useEffect above
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = t('errors.loginFailed');
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('errors.loginFailed'), errorMessage, [{ text: t('common.ok') }]);
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
            <Text style={styles.title}>{t('auth.pointOfSale')}</Text>
            <Text style={styles.subtitle}>{t('auth.welcomeBack')}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            {/* Biometric login button */}
            {biometricAvailable && biometricEnabled && !checkingBiometric && (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  padding: 16,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
                onPress={handleBiometricLogin}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={biometricType === 'Face ID' || biometricType === 'Face Recognition' ? 'scan' : 'finger-print'}
                  size={24}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {t('auth.signInWith', { type: biometricType })}
                </Text>
              </TouchableOpacity>
            )}

            {checkingBiometric && (
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}

            {biometricAvailable && biometricEnabled && !checkingBiometric && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
                <Text style={{ marginHorizontal: 16, color: Colors.textSecondary || '#6B7280' }}>{t('auth.or')}</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              </View>
            )}

            <Input
              placeholder={t('auth.email')}
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
              placeholder={t('auth.password')}
              value={credentials.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              editable={!isSubmitting}
              error={passwordError}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
            
            <Button 
              title={isSubmitting ? t('auth.signingIn') : t('auth.signIn')} 
              onPress={handleLogin} 
              disabled={isSubmitting}
              accessibilityLabel={isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
              accessibilityHint="Authenticate with your email and password"
            />
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>{t('auth.dontHaveAccount')} </Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/signup')}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Go to sign up"
                accessibilityHint="Navigate to the sign up screen"
              >
                <Text style={styles.link}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
            
            <DemoInfo />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}