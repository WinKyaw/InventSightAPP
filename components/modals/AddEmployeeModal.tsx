import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEmployees } from '../../context/EmployeesContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';

interface AddEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  hourlyRate?: string;
  phone?: string;
  title?: string;
}

export function AddEmployeeModal({ visible, onClose }: AddEmployeeModalProps) {
  const { addEmployee, loading: employeesLoading } = useEmployees();
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    hourlyRate: '',
    phone: '',
    title: '',
    bonus: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // First name validation
    if (!newEmployee.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (newEmployee.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (newEmployee.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!newEmployee.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (newEmployee.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (newEmployee.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }

    // Hourly rate validation
    if (!newEmployee.hourlyRate.trim()) {
      errors.hourlyRate = 'Hourly rate is required';
    } else {
      const rate = parseFloat(newEmployee.hourlyRate);
      if (isNaN(rate) || rate <= 0) {
        errors.hourlyRate = 'Hourly rate must be a positive number';
      } else if (rate > 1000) {
        errors.hourlyRate = 'Hourly rate seems too high (max $1000/hr)';
      }
    }

    // Phone validation
    if (!newEmployee.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(newEmployee.phone.trim())) {
        errors.phone = 'Invalid phone number format';
      } else if (newEmployee.phone.trim().length < 10) {
        errors.phone = 'Phone number must be at least 10 characters';
      }
    }

    // Title validation (optional but if provided, validate)
    if (newEmployee.title.trim() && newEmployee.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof typeof newEmployee, value: string) => {
    setNewEmployee(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddEmployee = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addEmployee({
        firstName: newEmployee.firstName.trim(),
        lastName: newEmployee.lastName.trim(),
        checkInTime: 'Not checked in',
        hourlyRate: parseFloat(newEmployee.hourlyRate),
        phone: newEmployee.phone.trim(),
        totalCompensation: parseFloat(newEmployee.hourlyRate) * 2080, // 40 hours * 52 weeks
        startDate: newEmployee.startDate,
        status: 'Active',
        title: newEmployee.title.trim() || 'Staff',
        bonus: parseFloat(newEmployee.bonus) || 0,
      });
      
      // Reset form
      setNewEmployee({ 
        firstName: '', 
        lastName: '', 
        hourlyRate: '', 
        phone: '', 
        title: '', 
        bonus: '', 
        startDate: new Date().toISOString().split('T')[0] 
      });
      setValidationErrors({});
      onClose();
      Alert.alert('Success', 'Employee added successfully!');
    } catch (error) {
      console.error('Failed to add employee:', error);
      Alert.alert('Error', 'Failed to add employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
      
  return (
    <Modal visible={visible} onClose={onClose} title="Add New Employee">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.modalRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              placeholder="First Name *"
              value={newEmployee.firstName}
              onChangeText={(text) => handleInputChange('firstName', text)}
              style={{ flex: 1 }}
            />
            {validationErrors.firstName && (
              <View style={styles.fieldErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.fieldErrorText}>{validationErrors.firstName}</Text>
              </View>
            )}
          </View>
          
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              placeholder="Last Name *"
              value={newEmployee.lastName}
              onChangeText={(text) => handleInputChange('lastName', text)}
              style={{ flex: 1 }}
            />
            {validationErrors.lastName && (
              <View style={styles.fieldErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.fieldErrorText}>{validationErrors.lastName}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View>
          <Input
            placeholder="Job Title (Optional)"
            value={newEmployee.title}
            onChangeText={(text) => handleInputChange('title', text)}
          />
          {validationErrors.title && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.title}</Text>
            </View>
          )}
        </View>
        
        <View>
          <Input
            placeholder="Hourly Rate ($) *"
            value={newEmployee.hourlyRate}
            onChangeText={(text) => handleInputChange('hourlyRate', text)}
            keyboardType="numeric"
          />
          {validationErrors.hourlyRate && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.hourlyRate}</Text>
            </View>
          )}
        </View>
        
        <Input
          placeholder="Annual Bonus ($) (Optional)"
          value={newEmployee.bonus}
          onChangeText={(text) => handleInputChange('bonus', text)}
          keyboardType="numeric"
        />
        
        <View>
          <Input
            placeholder="Phone Number *"
            value={newEmployee.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            keyboardType="phone-pad"
          />
          {validationErrors.phone && (
            <View style={styles.fieldErrorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.fieldErrorText}>{validationErrors.phone}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.modalButtons}>
          <Button 
            title="Cancel" 
            onPress={onClose} 
            color="#F3F4F6" 
            textStyle={{ color: '#374151' }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button 
            title={isSubmitting ? "Adding..." : "Add Employee"}
            onPress={handleAddEmployee}
            disabled={isSubmitting}
            color="#8B5CF6"
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}