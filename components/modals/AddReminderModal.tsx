import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useCalendar } from '../../context/CalendarContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddReminderModal({ visible, onClose }: AddReminderModalProps) {
  const { addReminder } = useCalendar();
  const [newReminder, setNewReminder] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'order' as 'order' | 'meeting' | 'maintenance',
    time: '',
    description: ''
  });

  const handleAddReminder = () => {
    if (newReminder.title && newReminder.date && newReminder.time) {
      addReminder(newReminder);
      
      setNewReminder({ 
        title: '', 
        date: new Date().toISOString().split('T')[0], 
        type: 'order', 
        time: '', 
        description: '' 
      });
      onClose();
      Alert.alert('Success', `Reminder "${newReminder.title}" has been created!`);
    } else {
      Alert.alert('Error', 'Please fill all required fields (Title, Date, Time)');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add Reminder">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Input
          placeholder="Reminder Title *"
          value={newReminder.title}
          onChangeText={(text) => setNewReminder({...newReminder, title: text})}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Type:</Text>
          <View style={styles.pickerRow}>
            {(['order', 'meeting', 'maintenance'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, newReminder.type === type && styles.pickerOptionSelected]}
                onPress={() => setNewReminder({...newReminder, type})}
              >
                <Text style={[styles.pickerOptionText, newReminder.type === type && styles.pickerOptionTextSelected]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Input
          placeholder="Date (YYYY-MM-DD) *"
          value={newReminder.date}
          onChangeText={(text) => setNewReminder({...newReminder, date: text})}
        />
        
        <Input
          placeholder="Time (e.g., 2:00 PM) *"
          value={newReminder.time}
          onChangeText={(text) => setNewReminder({...newReminder, time: text})}
        />
        
        <Input
          placeholder="Description (optional)"
          value={newReminder.description}
          onChangeText={(text) => setNewReminder({...newReminder, description: text})}
          multiline
          numberOfLines={3}
          style={styles.textArea}
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
            title="Add Reminder" 
            onPress={handleAddReminder} 
            color="#F59E0B"
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}