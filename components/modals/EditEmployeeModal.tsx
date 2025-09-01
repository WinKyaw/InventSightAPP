import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Employee } from '../../types';
import { styles } from '../../constants/Styles';

interface EditEmployeeModalProps {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (updatedEmployee: Partial<Employee>) => void;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  hourlyRate?: string;
  phone?: string;
  title?: string;
}

export function EditEmployeeModal({ visible, employee, onClose, onSave }: EditEmployeeModalProps) {
  const [editedEmployee, setEditedEmployee] = useState({
    firstName: '',
    lastName: '',
    hourlyRate: '',
    phone: '',
    title: '',
    bonus: '',
    status: 'Active'
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when employee changes
  useEffect(() => {
    if (employee) {
      setEditedEmployee({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        hourlyRate: employee.hourlyRate?.toString() || '',
        phone: employee.phone || '',
        title: employee.title || '',
        bonus: employee.bonus?.toString() || '',
        status: employee.status || 'Active'
      });
    }
  }, [employee]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // First name validation
    if (!editedEmployee.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (editedEmployee.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (editedEmployee.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!editedEmployee.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (editedEmployee.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (editedEmployee.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }

    // Hourly rate validation
    if (!editedEmployee.hourlyRate.trim()) {
      errors.hourlyRate = 'Hourly rate is required';
    } else {
      const rate = parseFloat(editedEmployee.hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        errors.hourlyRate = 'Hourly rate must be a positive number';
      } else if (rate > 1000) {
        errors.hourlyRate = 'Hourly rate seems too high (max $1000/hr)';
      }
    }

    // Phone validation
    if (!editedEmployee.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(editedEmployee.phone.trim())) {
        errors.phone = 'Invalid phone number format';
      } else if (editedEmployee.phone.trim().length < 10) {
        errors.phone = 'Phone number must be at least 10 characters';
      }
    }

    // Title validation (optional but if provided, validate)
    if (editedEmployee.title.trim() && editedEmployee.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof typeof editedEmployee, value: string) => {
    setEditedEmployee(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveEmployee = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors below');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedData: Partial<Employee> = {
        firstName: editedEmployee.firstName.trim(),
        lastName: editedEmployee.lastName.trim(),
        hourlyRate: parseFloat(editedEmployee.hourlyRate),
        phone: editedEmployee.phone.trim(),
        title: editedEmployee.title.trim() || 'Employee',
        bonus: parseFloat(editedEmployee.bonus) || 0,
        status: editedEmployee.status,
        totalCompensation: parseFloat(editedEmployee.hourlyRate) * 2080 // 40 hours * 52 weeks
      };

      onSave(updatedData);
    } catch (error: any) {
      console.error('Edit employee error:', error);
      Alert.alert('Error', 'Failed to update employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setValidationErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title="Edit Employee">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Input
            placeholder="First Name"
            value={editedEmployee.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            error={validationErrors.firstName}
            editable={!isSubmitting}
            maxLength={50}
          />
          
          <Input
            placeholder="Last Name"
            value={editedEmployee.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            error={validationErrors.lastName}
            editable={!isSubmitting}
            maxLength={50}
          />
          
          <Input
            placeholder="Phone Number"
            value={editedEmployee.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            keyboardType="phone-pad"
            error={validationErrors.phone}
            editable={!isSubmitting}
            maxLength={20}
          />

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Employment Details</Text>
          
          <Input
            placeholder="Job Title"
            value={editedEmployee.title}
            onChangeText={(value) => handleInputChange('title', value)}
            error={validationErrors.title}
            editable={!isSubmitting}
            maxLength={100}
          />
          
          <Input
            placeholder="Hourly Rate ($)"
            value={editedEmployee.hourlyRate}
            onChangeText={(value) => handleInputChange('hourlyRate', value)}
            keyboardType="numeric"
            error={validationErrors.hourlyRate}
            editable={!isSubmitting}
          />
          
          <Input
            placeholder="Annual Bonus ($)"
            value={editedEmployee.bonus}
            onChangeText={(value) => handleInputChange('bonus', value)}
            keyboardType="numeric"
            editable={!isSubmitting}
          />

          <View style={[styles.employeeStats, { marginTop: 20 }]}>
            <Button
              title="Cancel"
              onPress={handleClose}
              color="#6B7280"
              disabled={isSubmitting}
              style={{ marginRight: 12 }}
            />
            
            <Button
              title={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleSaveEmployee}
              color="#10B981"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}