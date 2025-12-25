import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
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
    const items: PredefinedItemRequest[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length === 0 || !parts[0]) continue;

      const item: PredefinedItemRequest = {
        name: parts[0],
        category: parts[1] || defaultCategory,
        unitType: parts[2] || defaultUnitType,
        sku: parts[3] || undefined,
        defaultPrice: parts[4] ? parseFloat(parts[4]) : undefined,
      };

      items.push(item);
    }

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
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Bulk Add Items</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
              placeholder="Apples, Food, lb, APL-001, 2.99&#10;Bananas, Food, lb, BAN-001, 1.49&#10;Milk, Beverages, gal, MLK-001, 4.99"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={8}
            />

            {/* Default Values */}
            <Text style={styles.sectionTitle}>Default Values</Text>
            <Text style={styles.sectionSubtitle}>
              Used for items without category/unit specified
            </Text>

            <View style={styles.inputGroup}>
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
            </View>

            <View style={styles.inputGroup}>
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
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Add All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  picker: {
    height: 50,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
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
