import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal as RNModal, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterSortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSelectSort: (sortBy: string) => void;
  onToggleSortOrder: () => void;
}

export function FilterSortModal({ 
  visible, 
  onClose, 
  selectedCategory, 
  onSelectCategory, 
  categories,
  sortBy,
  sortOrder,
  onSelectSort,
  onToggleSortOrder
}: FilterSortModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text style={styles.filterIcon}>🔍</Text>
                  <Text style={styles.title}>FILTER</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Category Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>CATEGORY</Text>
                  </View>
                  
                  <View style={styles.categoryChips}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryChip,
                          selectedCategory === category && styles.selectedCategoryChip
                        ]}
                        onPress={() => onSelectCategory(category)}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          selectedCategory === category && styles.selectedCategoryChipText
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Sort Section */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>SORT BY</Text>
                    <TouchableOpacity 
                      style={styles.directionToggle}
                      onPress={onToggleSortOrder}
                    >
                      <Text style={styles.directionToggleText}>
                        {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.sortOption}
                    onPress={() => onSelectSort('name')}
                  >
                    <Text style={styles.sortOptionText}>Name (A-Z)</Text>
                    <View style={[styles.sortToggle, sortBy === 'name' && styles.activeSortToggle]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.sortOption}
                    onPress={() => onSelectSort('price')}
                  >
                    <Text style={styles.sortOptionText}>Price</Text>
                    <View style={[styles.sortToggle, sortBy === 'price' && styles.activeSortToggle]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.sortOption}
                    onPress={() => onSelectSort('quantity')}
                  >
                    <Text style={styles.sortOptionText}>Stock</Text>
                    <View style={[styles.sortToggle, sortBy === 'quantity' && styles.activeSortToggle]} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.sortOption}
                    onPress={() => onSelectSort('total')}
                  >
                    <Text style={styles.sortOptionText}>Total Value</Text>
                    <View style={[styles.sortToggle, sortBy === 'total' && styles.activeSortToggle]} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.sortOption}
                    onPress={() => onSelectSort('salesCount')}
                  >
                    <Text style={styles.sortOptionText}>Sales Count</Text>
                    <View style={[styles.sortToggle, sortBy === 'salesCount' && styles.activeSortToggle]} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              {/* Apply Button */}
              <TouchableOpacity
                style={styles.applyButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 550,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  filterIcon: {
    fontSize: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  selectedCategoryChip: {
    backgroundColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  directionToggle: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  directionToggleText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
  },
  sortToggle: {
    width: 20,
    height: 12,
    backgroundColor: '#DDD',
    borderRadius: 6,
  },
  activeSortToggle: {
    backgroundColor: '#10B981',
  },
  applyButton: {
    backgroundColor: '#D1FAE5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});
