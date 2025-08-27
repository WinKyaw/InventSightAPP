import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  style?: any;
}

export function PasswordStrengthIndicator({ password, style }: PasswordStrengthIndicatorProps) {
  const strength = getPasswordStrength(password);
  
  if (!password) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.strengthBar}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthSegment,
              {
                backgroundColor: level <= strength.score ? strength.color : '#E5E7EB',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthText, { color: strength.color }]}>
        {strength.feedback}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  strengthBar: {
    flexDirection: 'row',
    height: 4,
    gap: 2,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
});