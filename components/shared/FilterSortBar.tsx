import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterSortBarProps {
  selectedCategory: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterPress: () => void;
  onSortPress: () => void;
  onClearFilter: () => void;
}

export function FilterSortBar({ 
  selectedCategory, 
  sortBy, 
  sortOrder, 
  onFilterPress, 
  onSortPress, 
  onClearFilter 
}: FilterSortBarProps) {
  const getSortLabel = () => {
    const labels: Record<string, string> = { 
      name: 'Name', 
      price: 'Price', 
      quantity: 'Stock', 
      total: 'Value', 
      salesCount: 'Sales' 
    };
    return labels[sortBy] || 'Name';
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedCategory !== 'All' && styles.filterButtonActive
          ]}
          onPress={onFilterPress}
        >
          <Ionicons 
            name="funnel-outline" 
            size={16} 
            color={selectedCategory !== 'All' ? '#10B981' : '#6B7280'} 
          />
          <Text style={[
            styles.filterButtonText,
            selectedCategory !== 'All' && styles.filterButtonTextActive
          ]}>
            {selectedCategory === 'All' ? 'Filter' : selectedCategory}
          </Text>
          {selectedCategory !== 'All' && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={onClearFilter}
            >
              <Ionicons name="close-circle" size={16} color="#10B981" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={onSortPress}
        >
          <Ionicons name="swap-vertical-outline" size={16} color="#6B7280" />
          <Text style={styles.sortButtonText}>
            {getSortLabel()}
          </Text>
          <Ionicons 
            name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
            size={14} 
            color="#6B7280" 
          />
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  clearFilterButton: {
    marginLeft: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});