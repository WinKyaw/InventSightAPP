import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({ 
  title, 
  onPress, 
  color = '#3B82F6', 
  style, 
  textStyle,
  disabled = false,
  leftIcon,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: disabled ? '#D1D5DB' : color },
        style
      ]} 
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <View style={styles.buttonContent}>
        {leftIcon}
        {!leftIcon && disabled && title.includes("...") ? (
          <ActivityIndicator size="small" color="white" />
        ) : title ? (
          <Text style={[styles.buttonText, { color: disabled ? '#9CA3AF' : 'white' }, textStyle]}>
            {title}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});