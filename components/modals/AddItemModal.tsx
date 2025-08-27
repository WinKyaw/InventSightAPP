import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItems } from '../../context/ItemsContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { styles } from '../../constants/Styles';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddItemModal({ visible, onClose }: AddItemModalProps) {
  const { addItem } = useItems();
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    quantity: '',
    category: 'Beverages'
  });
  const [showScanOption, setShowScanOption] = useState(false);

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.quantity) {
      addItem({
        name: newItem.name,
        price: parseFloat(newItem.price),
        quantity: parseInt(newItem.quantity),
        category: newItem.category,
      });
      
      setNewItem({ name: '', price: '', quantity: '', category: 'Beverages' });
      onClose();
      Alert.alert('Success', `${newItem.name} has been added to inventory!`);
    } else {
      Alert.alert('Error', 'Please fill all required fields');
    }
  };

  const handleScanBarcode = () => {
    const mockBarcodeData = {
      name: 'Scanned Product',
      price: '12.99'
    };
    setNewItem({
      ...newItem,
      name: mockBarcodeData.name,
      price: mockBarcodeData.price
    });
    setShowScanOption(false);
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Add New Item">
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => setShowScanOption(!showScanOption)}
        >
          <Ionicons name="camera" size={16} color="#3B82F6" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        {showScanOption && (
          <View style={styles.scanContainer}>
            <View style={styles.scanContent}>
              <Ionicons name="camera" size={48} color="#3B82F6" />
              <Text style={styles.scanText}>Point camera at barcode to scan product</Text>
              <TouchableOpacity style={styles.scanSimulateButton} onPress={handleScanBarcode}>
                <Text style={styles.scanSimulateButtonText}>Simulate Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <Input
          placeholder="Item Name"
          value={newItem.name}
          onChangeText={(text) => setNewItem({...newItem, name: text})}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Category:</Text>
          <View style={styles.pickerRow}>
            {['Beverages', 'Food', 'Bakery'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.pickerOption, newItem.category === category && styles.pickerOptionSelected]}
                onPress={() => setNewItem({...newItem, category})}
              >
                <Text style={[styles.pickerOptionText, newItem.category === category && styles.pickerOptionTextSelected]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <Input
          placeholder="Price"
          value={newItem.price}
          onChangeText={(text) => setNewItem({...newItem, price: text})}
          keyboardType="numeric"
        />
        
        <Input
          placeholder="Quantity"
          value={newItem.quantity}
          onChangeText={(text) => setNewItem({...newItem, quantity: text})}
          keyboardType="numeric"
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
            title="Add Item" 
            onPress={handleAddItem} 
            style={{ flex: 1, marginLeft: 6 }}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}