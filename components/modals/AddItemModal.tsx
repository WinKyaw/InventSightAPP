import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { itemToCreateProductRequest } from '../../utils/productUtils';
import { styles } from '../../constants/Styles';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddItemModal({ visible, onClose }: AddItemModalProps) {
  const { createProduct, categories, loading } = useItemsApi();
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    quantity: '',
    category: 'Beverages',
    description: '',
    sku: '',
    minStock: '',
    maxStock: ''
  });
  const [showScanOption, setShowScanOption] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setNewItem({
        name: '',
        price: '',
        quantity: '',
        category: 'Beverages',
        description: '',
        sku: '',
        minStock: '',
        maxStock: ''
      });
      setShowScanOption(false);
    }
  }, [visible]);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.quantity) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Price, Quantity)');
      return;
    }

    const price = parseFloat(newItem.price);
    const quantity = parseInt(newItem.quantity);
    const minStock = newItem.minStock ? parseInt(newItem.minStock) : undefined;
    const maxStock = newItem.maxStock ? parseInt(newItem.maxStock) : undefined;

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (minStock !== undefined && (isNaN(minStock) || minStock < 0)) {
      Alert.alert('Error', 'Please enter a valid minimum stock');
      return;
    }

    if (maxStock !== undefined && (isNaN(maxStock) || maxStock < 0)) {
      Alert.alert('Error', 'Please enter a valid maximum stock');
      return;
    }

    if (minStock !== undefined && maxStock !== undefined && minStock > maxStock) {
      Alert.alert('Error', 'Minimum stock cannot be greater than maximum stock');
      return;
    }

    try {
      setIsSubmitting(true);

      const productData = itemToCreateProductRequest({
        name: newItem.name,
        price: price,
        quantity: quantity,
        category: newItem.category,
        description: newItem.description || undefined,
        sku: newItem.sku || undefined,
        minStock: minStock,
        maxStock: maxStock,
      });

      await createProduct(productData);
      onClose();
    } catch (error) {
      console.error('Failed to add product:', error);
      // Error alert is handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanBarcode = () => {
    const mockBarcodeData = {
      name: 'Scanned Product',
      price: '12.99',
      sku: 'SKU-' + Date.now()
    };
    setNewItem({
      ...newItem,
      name: mockBarcodeData.name,
      price: mockBarcodeData.price,
      sku: mockBarcodeData.sku
    });
    setShowScanOption(false);
  };

  // Get available categories
  const availableCategories = categories.length > 0 
    ? categories.map(cat => cat.name)
    : ['Beverages', 'Food', 'Bakery'];

  return (
    <Modal visible={visible} onClose={onClose} title="Add New Product">
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
          placeholder="Product Name *"
          value={newItem.name}
          onChangeText={(text) => setNewItem({...newItem, name: text})}
        />

        <Input
          placeholder="SKU (Optional)"
          value={newItem.sku}
          onChangeText={(text) => setNewItem({...newItem, sku: text})}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {availableCategories.map((category) => (
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
          </ScrollView>
        </View>
        
        <Input
          placeholder="Price *"
          value={newItem.price}
          onChangeText={(text) => setNewItem({...newItem, price: text})}
          keyboardType="numeric"
        />
        
        <Input
          placeholder="Quantity *"
          value={newItem.quantity}
          onChangeText={(text) => setNewItem({...newItem, quantity: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Minimum Stock (Optional)"
          value={newItem.minStock}
          onChangeText={(text) => setNewItem({...newItem, minStock: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Maximum Stock (Optional)"
          value={newItem.maxStock}
          onChangeText={(text) => setNewItem({...newItem, maxStock: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Description (Optional)"
          value={newItem.description}
          onChangeText={(text) => setNewItem({...newItem, description: text})}
          multiline={true}
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />
        
        <View style={styles.modalButtons}>
          <Button 
            title="Cancel" 
            onPress={onClose} 
            color="#F3F4F6" 
            textStyle={{ color: '#374151' }}
            style={{ flex: 1, marginRight: 6 }}
            disabled={isSubmitting}
          />
          <Button 
            title={isSubmitting ? '' : 'Add Product'}
            onPress={handleAddItem} 
            style={{ flex: 1, marginLeft: 6 }}
            disabled={isSubmitting}
            leftIcon={isSubmitting ? 
              <ActivityIndicator size="small" color="white" /> : 
              undefined
            }
          />
        </View>
      </ScrollView>
    </Modal>
  );
}