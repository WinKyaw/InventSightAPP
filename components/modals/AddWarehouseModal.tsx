import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';
import { apiClient } from '../../services/api/apiClient';

interface AddWarehouseModalProps {
  visible: boolean;
  onClose: () => void;
  onWarehouseAdded?: () => void;
}

interface ValidationErrors {
  name?: string;
  location?: string;
  code?: string;
}

export function AddWarehouseModal({ visible, onClose, onWarehouseAdded }: AddWarehouseModalProps) {
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    location: '',
    code: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!newWarehouse.name.trim()) {
      errors.name = 'Warehouse name is required';
    } else if (newWarehouse.name.trim().length < 2) {
      errors.name = 'Warehouse name must be at least 2 characters';
    } else if (newWarehouse.name.trim().length > 100) {
      errors.name = 'Warehouse name must be less than 100 characters';
    }

    // Location validation (optional but if provided, validate)
    if (newWarehouse.location.trim() && newWarehouse.location.trim().length > 200) {
      errors.location = 'Location must be less than 200 characters';
    }

    // Code validation (optional but if provided, validate)
    if (newWarehouse.code.trim() && newWarehouse.code.trim().length > 20) {
      errors.code = 'Code must be less than 20 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof typeof newWarehouse, value: string) => {
    setNewWarehouse(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddWarehouse = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const warehouseName = newWarehouse.name.trim();
      
      await apiClient.post('/api/warehouses', {
        name: warehouseName,
        location: newWarehouse.location.trim() || undefined,
        code: newWarehouse.code.trim() || undefined,
        isActive: true, // New warehouses are created as active by default
      });
      
      // Reset form
      setNewWarehouse({ 
        name: '', 
        location: '', 
        code: '',
      });
      setValidationErrors({});
      onClose();
      Alert.alert('Success', `Warehouse "${warehouseName}" has been added!`);
      
      // Notify parent to refresh warehouse list
      if (onWarehouseAdded) {
        onWarehouseAdded();
      }
    } catch (error) {
      console.error('Failed to add warehouse:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add warehouse. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
      
  return (
    <Modal visible={visible} onClose={onClose} title="Add New Warehouse">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Input
            placeholder="Warehouse Name *"
            value={newWarehouse.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
          {validationErrors.name && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.name}</Text>
            </View>
          )}
        </View>
        
        <View>
          <Input
            placeholder="Location (Optional)"
            value={newWarehouse.location}
            onChangeText={(text) => handleInputChange('location', text)}
          />
          {validationErrors.location && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.location}</Text>
            </View>
          )}
        </View>

        <View>
          <Input
            placeholder="Warehouse Code (Optional)"
            value={newWarehouse.code}
            onChangeText={(text) => handleInputChange('code', text)}
          />
          {validationErrors.code && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.code}</Text>
            </View>
          )}
        </View>

        <View style={styles.modalButtons}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Add Warehouse"
            onPress={handleAddWarehouse}
            loading={isSubmitting}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}
