import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  style?: any;
  error?: string | null;
  containerStyle?: any;
  success?: boolean;
  showValidationIcon?: boolean;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({ 
  style, 
  error, 
  containerStyle, 
  success, 
  showValidationIcon = true,
  onBlur,
  onFocus,
  ...props 
}, ref) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputStyle = () => {
    if (error) return styles.inputError;
    if (success && !isFocused) return styles.inputSuccess;
    if (isFocused) return styles.inputFocused;
    return null;
  };

  const showIcon = showValidationIcon && !isFocused && (error || success);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          style={[
            styles.input, 
            getInputStyle(),
            showIcon && styles.inputWithIcon,
            style
          ]}
          placeholderTextColor="#6B7280"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={error ? "alert-circle" : "checkmark-circle"} 
              size={20} 
              color={error ? "#EF4444" : "#10B981"} 
            />
          </View>
        )}
      </View>
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
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
  inputWithIcon: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#10B981',
    borderWidth: 1,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});