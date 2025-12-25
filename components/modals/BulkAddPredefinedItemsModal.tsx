import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/Colors';
import { PredefinedItemRequest } from '../../types/predefinedItems';

interface BulkAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (items: PredefinedItemRequest[]) => void;
}

const CATEGORIES = ['Food', 'Beverages', 'Electronics', 'Clothing', 'Other'];
const UNIT_TYPES = ['pcs', 'kg', 'lb', 'liters', 'gal', 'oz', 'boxes'];

export function BulkAddPredefinedItemsModal({ visible, onClose, onSave }: BulkAddModalProps) {
  const [bulkText, setBulkText] = useState('');
  const [defaultCategory, setDefaultCategory] = useState('Food');
  const [defaultUnitType, setDefaultUnitType] = useState('pcs');

  const handleSave = () => {
    if (!bulkText.trim()) {
      Alert.alert('Error', 'Please enter at least one item');
      return;
    }

    const lines = bulkText.split('\n').filter(line => line.trim());
    
    // Backend expects array of objects with string values
    const items = lines.map(line => {
      const parts = line.split(',').map(p => p.trim());
      
      const item: any = {
        name: parts[0] || '',
        category: parts[1] || defaultCategory,
        unitType: parts[2] || defaultUnitType,
      };
      
      // Optional fields
      if (parts[3]) item.sku = parts[3];
      if (parts[4]) item.defaultPrice = parts[4]; // Keep as string
      if (parts[5]) item.description = parts[5];
      
      return item;
    }).filter(item => item.name); // Remove empty items

    if (items.length === 0) {
      Alert.alert('Error', 'No valid items found');
      return;
    }

    onSave(items);
    setBulkText('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Bulk Add Items</Text>
          <View style={{ width: 24 }} /> {/* Spacer */}
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Enter one item per line. Formats:{'\n'}
              • Name{'\n'}
              • Name, Category, Unit{'\n'}
              • Name, Category, Unit, SKU, Price
            </Text>
          </View>

          {/* Bulk Text Input */}
          <Text style={styles.label}>Items (one per line)</Text>
          <TextInput
            style={styles.textArea}
            value={bulkText}
            onChangeText={setBulkText}
            placeholder={'Apples, Food, lb, APL-001, 2.99\nBananas, Food, lb, BAN-001, 1.49\nMilk, Beverages, gal, MLK-001, 4.99'}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={8}
          />

          {/* Default Values */}
          <Text style={styles.sectionTitle}>Default Values</Text>
          <Text style={styles.sectionSubtitle}>
            Used for items without category/unit specified
          </Text>

          <Text style={styles.label}>Default Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={defaultCategory}
              onValueChange={setDefaultCategory}
              style={styles.picker}
            >
              {CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Default Unit Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={defaultUnitType}
              onValueChange={setDefaultUnitType}
              style={styles.picker}
            >
              {UNIT_TYPES.map((unit) => (
                <Picker.Item key={unit} label={unit} value={unit} />
              ))}
            </Picker>
          </View>
        </ScrollView>

        {/* Fixed bottom buttons */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Add All</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Full-screen container
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  // Header with back button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  
  // Scrollable content area
  content: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  
  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.lightBlue,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  
  // Form fields
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: 'white',
    minHeight: 150,
    maxHeight: 250,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 4,
  },
  
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
    marginTop: 8,
  },
  
  picker: {
    height: 50,
  },
  
  // Fixed bottom action buttons
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: 'center',
  },
  
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
