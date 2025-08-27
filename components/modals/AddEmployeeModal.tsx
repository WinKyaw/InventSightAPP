import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useEmployees } from '../../context/EmployeesContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';

interface AddEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddEmployeeModal({ visible, onClose }: AddEmployeeModalProps) {
  const { addEmployee } = useEmployees();
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    hourlyRate: '',
    phone: '',
    title: '',
    bonus: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleAddEmployee = () => {
    if (newEmployee.firstName && newEmployee.lastName && newEmployee.hourlyRate && newEmployee.phone) {
      addEmployee({
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        checkInTime: 'Not checked in',
        hourlyRate: parseFloat(newEmployee.hourlyRate),
        phone: newEmployee.phone,
        totalCompensation: parseFloat(newEmployee.hourlyRate) * 2080, // 40 hours * 52 weeks
        startDate: newEmployee.startDate,
        status: 'Active',
        title: newEmployee.title || 'Staff',
        bonus: parseFloat(newEmployee.bonus) || 0,
      });
      
      setNewEmployee({ 
        firstName: '', 
        lastName: '', 
        hourlyRate: '', 
        phone: '', 
        title: '', 
        bonus: '', 
        startDate: new Date().toISOString().split('T')[0] 
      });
      onClose();
      Alert.alert('Success', `${newEmployee.firstName} ${newEmployee.lastName} has been added to the team!`);
    } else {
      Alert.alert('Error', 'Please fill all required fields (First Name, Last Name, Hourly Rate, Phone)');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add New Employee">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.modalRow}>
          <Input
            placeholder="First Name *"
            value={newEmployee.firstName}
            onChangeText={(text) => setNewEmployee({...newEmployee, firstName: text})}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Input
            placeholder="Last Name *"
            value={newEmployee.lastName}
            onChangeText={(text) => setNewEmployee({...newEmployee, lastName: text})}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
        
        <Input
          placeholder="Job Title (Optional)"
          value={newEmployee.title}
          onChangeText={(text) => setNewEmployee({...newEmployee, title: text})}
        />
        
        <Input
          placeholder="Hourly Rate ($) *"
          value={newEmployee.hourlyRate}
          onChangeText={(text) => setNewEmployee({...newEmployee, hourlyRate: text})}
          keyboardType="numeric"
        />
        
        <Input
          placeholder="Annual Bonus ($) (Optional)"
          value={newEmployee.bonus}
          onChangeText={(text) => setNewEmployee({...newEmployee, bonus: text})}
          keyboardType="numeric"
        />
        
        <Input
          placeholder="Phone Number *"
          value={newEmployee.phone}
          onChangeText={(text) => setNewEmployee({...newEmployee, phone: text})}
          keyboardType="phone-pad"
        />
        
        <View style={styles.modalButtons}>
          <Button 
            title="Cancel" 
            onPress={onClose} 
            color="#F3F4F6" 
            textStyle={{ color: '#374151' }}
            style={{ flex: 1, marginRight: 6 }}
          />
          <Button 
            title="Add Employee" 
            onPress={handleAddEmployee} 
            color="#8B5CF6"
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}