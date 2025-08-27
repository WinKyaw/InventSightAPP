import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TermsCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  error?: string | null;
  style?: any;
}

export function TermsCheckbox({ checked, onToggle, error, style }: TermsCheckboxProps) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel="Terms of service agreement"
        accessibilityHint="Accept terms of service and privacy policy to create account"
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked, error && styles.checkboxError]}>
          {checked && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxError: {
    borderColor: '#EF4444',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  termsLink: {
    color: '#10B981',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 32,
  },
});