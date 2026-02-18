import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GrowthIndicatorProps {
  value: number;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({ 
  value, 
  showIcon = true,
  size = 'medium' 
}) => {
  const isPositive = value >= 0;
  const color = isPositive ? '#10B981' : '#EF4444';
  const icon = isPositive ? 'trending-up' : 'trending-down';
  
  const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

  return (
    <View style={styles.container}>
      {showIcon && (
        <Ionicons 
          name={icon} 
          size={fontSize + 2} 
          color={color} 
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color, fontSize }]}>
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
