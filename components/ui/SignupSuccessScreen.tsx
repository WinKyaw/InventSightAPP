import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface SignupSuccessScreenProps {
  userEmail: string;
  onContinue: () => void;
  style?: any;
}

export function SignupSuccessScreen({ userEmail, onContinue, style }: SignupSuccessScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar backgroundColor="#10B981" barStyle="light-content" />
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Account Created!</Text>
          <Text style={styles.subtitle}>
            Welcome to InventSight! Your account has been successfully created.
          </Text>
          <Text style={styles.emailText}>
            A confirmation email has been sent to{'\n'}
            <Text style={styles.email}>{userEmail}</Text>
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>You can now:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="analytics" size={20} color="#10B981" style={styles.featureIcon} />
            <Text style={styles.featureText}>Track your inventory in real-time</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={20} color="#10B981" style={styles.featureIcon} />
            <Text style={styles.featureText}>Manage employees and access</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="document-text" size={20} color="#10B981" style={styles.featureIcon} />
            <Text style={styles.featureText}>Generate detailed reports</Text>
          </View>
        </View>

        <Button
          title="Get Started"
          onPress={onContinue}
          color="#10B981"
          style={styles.continueButton}
          accessibilityLabel="Continue to dashboard"
          accessibilityHint="Start using the inventory management system"
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    backgroundColor: '#ECFDF5',
    borderRadius: 50,
    padding: 16,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  email: {
    fontWeight: '600',
    color: '#10B981',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  continueButton: {
    paddingVertical: 16,
  },
});