import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
}

export function FilterModal({ 
  visible, 
  onClose, 
  selectedCategory, 
  onSelectCategory, 
  categories 
}: FilterModalProps) {
  const [customCategory, setCustomCategory] = useState('');

  const handleCustomCategoryAdd = () => {
    if (customCategory.trim()) {
      onSelectCategory(customCategory.trim());
      setCustomCategory('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Filter by Category">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.modalSubtitle}>Select Category</Text>
        
        <View style={styles.categoryList}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryOption,
                selectedCategory === category && styles.categoryOptionSelected
              ]}
              onPress={() => {
                onSelectCategory(category);
                onClose();
              }}
            >
              <Text style={[
                styles.categoryOptionText,
                selectedCategory === category && styles.categoryOptionTextSelected
              ]}>
                {category}
              </Text>
              {selectedCategory === category && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customCategorySection}>
          <Text style={styles.customCategoryLabel}>Or create new category:</Text>
          <View style={styles.customCategoryInput}>
            <Input
              placeholder="Enter new category name"
              value={customCategory}
              onChangeText={setCustomCategory}
              style={styles.customCategoryTextInput}
            />
            <Button
              title="Add"
              onPress={handleCustomCategoryAdd}
              disabled={!customCategory.trim()}
              color={!customCategory.trim() ? '#D1D5DB' : '#10B981'}
              style={styles.customCategoryButton}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}