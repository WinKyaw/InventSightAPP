import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingCartBadgeProps {
  itemCount: number;
  total: number;
  onPress: () => void;
}

export const FloatingCartBadge: React.FC<FloatingCartBadgeProps> = ({
  itemCount,
  total,
  onPress
}) => {
  if (itemCount === 0) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.badge}>
        <Ionicons name="cart" size={24} color="#fff" />
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{itemCount}</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total</Text>
        <Text style={styles.priceValue}>${total.toFixed(2)}</Text>
      </View>

      <Ionicons name="chevron-up" size={20} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  badge: {
    position: 'relative',
    marginRight: 12,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  priceContainer: {
    marginRight: 8,
  },
  priceLabel: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  priceValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
