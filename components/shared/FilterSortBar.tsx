import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterSortBarProps {
  selectedCategory: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterPress: () => void;
  itemCount?: number;
}

export function FilterSortBar({ 
  selectedCategory, 
  sortBy, 
  sortOrder, 
  onFilterPress,
  itemCount 
}: FilterSortBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Item count on the left */}
        {itemCount !== undefined && (
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
        
        {/* Filter icon button on the right */}
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={onFilterPress}
        >
          <Text style={styles.filterIcon}>☰</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countContainer: {
    flex: 1,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterIconButton: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterIcon: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: 'bold',
  },
});