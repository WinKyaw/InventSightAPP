import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { styles } from '../../constants/Styles';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSelectSort: (sortBy: string) => void;
}

export function SortModal({ 
  visible, 
  onClose, 
  sortBy, 
  sortOrder, 
  onSelectSort 
}: SortModalProps) {
  const sortOptions = [
    { key: 'name', label: 'Name', icon: 'text-outline' },
    { key: 'price', label: 'Price', icon: 'pricetag-outline' },
    { key: 'quantity', label: 'Stock', icon: 'cube-outline' },
    { key: 'total', label: 'Value', icon: 'cash-outline' },
    { key: 'salesCount', label: 'Sales', icon: 'trending-up-outline' }
  ];

  const handleSortSelect = (key: string) => {
    onSelectSort(key);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Sort Items">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalSubtitle}>Sort by</Text>
        
        <View style={styles.categoryList}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.categoryOption,
                sortBy === option.key && styles.categoryOptionSelected
              ]}
              onPress={() => handleSortSelect(option.key)}
            >
              <View style={styles.sortOptionLeft}>
                <Ionicons 
                  name={option.icon} 
                  size={20} 
                  color={sortBy === option.key ? '#10B981' : '#6B7280'} 
                />
                <Text style={[
                  styles.categoryOptionText,
                  { marginLeft: 12 },
                  sortBy === option.key && styles.categoryOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </View>
              <View style={styles.sortOptionRight}>
                {sortBy === option.key && (
                  <View style={styles.sortOrderIndicator}>
                    <Ionicons 
                      name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'} 
                      size={16} 
                      color="#10B981" 
                    />
                    <Text style={styles.sortOrderText}>
                      {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                    </Text>
                  </View>
                )}
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Modal>
  );
}