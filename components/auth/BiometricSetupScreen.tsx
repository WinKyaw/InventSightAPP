import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { biometricService } from '../../services/biometricService';
import { Colors } from '../../constants/Colors';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricSetupScreenProps {
  email: string;
  password: string;
  onComplete: () => void;
  onSkip: () => void;
}

export default function BiometricSetupScreen({
  email,
  password,
  onComplete,
  onSkip,
}: BiometricSetupScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsLoading(true);

      // Check if biometric hardware is available
      const available = await biometricService.isAvailable();
      setIsAvailable(available);

      if (!available) {
        setIsLoading(false);
        return;
      }

      // Check if biometric data is enrolled
      const enrolled = await biometricService.isEnrolled();
      setIsEnrolled(enrolled);

      // Get supported biometric types
      const types = await biometricService.getSupportedTypes();
      if (types.length > 0) {
        const typeName = biometricService.getBiometricTypeName(types[0]);
        setBiometricType(typeName);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      setIsLoading(false);
      setIsAvailable(false);
    }
  };

  const handleEnableBiometric = async () => {
    try {
      setIsLoading(true);

      if (!isEnrolled) {
        Alert.alert(
          'Biometrics Not Set Up',
          `Please set up ${biometricType} in your device settings first.`,
          [
            { text: 'OK', style: 'default' },
            { text: 'Skip', onPress: onSkip, style: 'cancel' },
          ]
        );
        setIsLoading(false);
        return;
      }

      await biometricService.enableBiometricLogin(email, password);

      Alert.alert(
        'Success',
        `${biometricType} login has been enabled successfully!`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      console.error('Failed to enable biometric login:', error);
      Alert.alert(
        'Error',
        'Failed to enable biometric login. Please try again later.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Biometric Setup',
      'You can enable biometric login later in Settings.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip', onPress: onSkip, style: 'destructive' },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Checking biometric availability...</Text>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={Colors.gray} />
        </View>
        <Text style={styles.title}>Biometrics Not Available</Text>
        <Text style={styles.description}>
          Your device doesn't support biometric authentication.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onSkip}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={
            biometricType === 'Face ID' || biometricType === 'Face Recognition'
              ? 'scan'
              : 'finger-print'
          }
          size={80}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.title}>Enable {biometricType}</Text>
      <Text style={styles.description}>
        {isEnrolled
          ? `Use ${biometricType} to quickly and securely log in to your account.`
          : `Set up ${biometricType} on your device first to enable this feature.`}
      </Text>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.featureText}>Fast and convenient login</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <Text style={styles.featureText}>Secure credential storage</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="lock-closed" size={24} color={Colors.success} />
          <Text style={styles.featureText}>Password fallback available</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEnableBiometric}
          disabled={!isEnrolled || isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isEnrolled ? `Enable ${biometricType}` : 'Set Up in Settings'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        You can enable this feature later in Settings
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary || '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  features: {
    width: '100%',
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary || '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary || '#6B7280',
    marginTop: 16,
  },
});
