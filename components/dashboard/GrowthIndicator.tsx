import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GrowthIndicatorProps {
  value: number;
  size?: 'small' | 'medium' | 'large';
}

export const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({ 
  value, 
  size = 'medium' 
}) => {
  const isPositive = value >= 0;
  const color = isPositive ? '#10B981' : '#EF4444';
  
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color, fontSize }]}>
        {isPositive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
