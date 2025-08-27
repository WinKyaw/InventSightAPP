import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  style?: any;
  error?: string | null;
  containerStyle?: any;
}

export function Input({ style, error, containerStyle, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[
          styles.input, 
          error ? styles.inputError : null, 
          style
        ]}
        placeholderTextColor="#6B7280"
        {...props}
      />
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});