import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/Colors';
import { PredefinedItemRequest } from '../../types/predefinedItems';

interface SingleItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: PredefinedItemRequest) => void;
}

const CATEGORIES = ['Food', 'Beverages', 'Electronics', 'Clothing', 'Other'];
const UNIT_TYPES = ['pcs', 'kg', 'lb', 'liters', 'gal', 'oz', 'boxes'];

export function AddSinglePredefinedItemModal({ visible, onClose, onSave }: SingleItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [unitType, setUnitType] = useState('pcs');
  const [sku, setSku] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    // Validate price if provided
    let price: number | undefined = undefined;
    if (defaultPrice) {
      const parsedPrice = parseFloat(defaultPrice);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        Alert.alert('Error', 'Please enter a valid price (must be a positive number)');
        return;
      }
      price = parsedPrice;
    }

    const item: PredefinedItemRequest = {
      name: name.trim(),
      category,
      unitType,
      sku: sku.trim() || undefined,
      defaultPrice: price,
      description: description.trim() || undefined,
    };

    onSave(item);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCategory('Food');
    setUnitType('pcs');
    setSku('');
    setDefaultPrice('');
    setDescription('');
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
            <Text style={styles.title}>Add Single Item</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Item Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Item Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Apples, Milk, Coffee"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Category <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Unit Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Unit Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={unitType}
                  onValueChange={setUnitType}
                  style={styles.picker}
                >
                  {UNIT_TYPES.map((unit) => (
                    <Picker.Item key={unit} label={unit} value={unit} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* SKU (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKU (Optional)</Text>
              <TextInput
                style={styles.input}
                value={sku}
                onChangeText={setSku}
                placeholder="e.g., APL-001"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Default Price (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Default Price (Optional)</Text>
              <TextInput
                style={styles.input}
                value={defaultPrice}
                onChangeText={setDefaultPrice}
                placeholder="e.g., 2.99"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            {/* Description (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add notes or description"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Item</Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
