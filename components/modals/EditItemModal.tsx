import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product, UpdateProductRequest } from '../../services/api/config';
import { styles } from '../../constants/Styles';

interface EditItemModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

export function EditItemModal({ visible, onClose, product }: EditItemModalProps) {
  const { updateProduct, categories, loading } = useItemsApi();
  const [editItem, setEditItem] = useState({
    name: '',
    price: '',
    quantity: '',
    category: 'Beverages',
    description: '',
    sku: '',
    minStock: '',
    maxStock: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or product changes
  useEffect(() => {
    if (visible && product) {
      setEditItem({
        name: product.name,
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        category: product.category,
        description: product.description || '',
        sku: product.sku || '',
        minStock: product.minStock?.toString() || '',
        maxStock: product.maxStock?.toString() || ''
      });
    } else if (!visible) {
      setEditItem({
        name: '',
        price: '',
        quantity: '',
        category: 'Beverages',
        description: '',
        sku: '',
        minStock: '',
        maxStock: ''
      });
    }
  }, [visible, product]);

  const handleUpdateItem = async () => {
    if (!product) return;

    if (!editItem.name || !editItem.price || !editItem.quantity) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Price, Quantity)');
      return;
    }

    const price = parseFloat(editItem.price);
    const quantity = parseInt(editItem.quantity);
    const minStock = editItem.minStock ? parseInt(editItem.minStock) : undefined;
    const maxStock = editItem.maxStock ? parseInt(editItem.maxStock) : undefined;

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

      const updateData: UpdateProductRequest = {
        name: editItem.name !== product.name ? editItem.name : undefined,
        price: price !== product.price ? price : undefined,
        quantity: quantity !== product.quantity ? quantity : undefined,
        category: editItem.category !== product.category ? editItem.category : undefined,
        description: editItem.description !== (product.description || '') ? editItem.description || undefined : undefined,
        sku: editItem.sku !== (product.sku || '') ? editItem.sku || undefined : undefined,
        minStock: minStock !== product.minStock ? minStock : undefined,
        maxStock: maxStock !== product.maxStock ? maxStock : undefined,
      };

      // Only send fields that have changed
      const hasChanges = Object.values(updateData).some(value => value !== undefined);
      if (!hasChanges) {
        Alert.alert('No Changes', 'No changes were made to the product.');
        onClose();
        return;
      }

      await updateProduct(product.id, updateData);
      onClose();
    } catch (error) {
      console.error('Failed to update product:', error);
      // Error alert is handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available categories
  const availableCategories = categories.length > 0 
    ? categories.map(cat => cat.name)
    : ['Beverages', 'Food', 'Bakery'];

  if (!product) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Edit Product">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Input
          placeholder="Product Name *"
          value={editItem.name}
          onChangeText={(text) => setEditItem({...editItem, name: text})}
        />

        <Input
          placeholder="SKU (Optional)"
          value={editItem.sku}
          onChangeText={(text) => setEditItem({...editItem, sku: text})}
        />
        
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {availableCategories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.pickerOption, editItem.category === category && styles.pickerOptionSelected]}
                  onPress={() => setEditItem({...editItem, category})}
                >
                  <Text style={[styles.pickerOptionText, editItem.category === category && styles.pickerOptionTextSelected]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        <Input
          placeholder="Price *"
          value={editItem.price}
          onChangeText={(text) => setEditItem({...editItem, price: text})}
          keyboardType="numeric"
        />
        
        <Input
          placeholder="Quantity *"
          value={editItem.quantity}
          onChangeText={(text) => setEditItem({...editItem, quantity: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Minimum Stock (Optional)"
          value={editItem.minStock}
          onChangeText={(text) => setEditItem({...editItem, minStock: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Maximum Stock (Optional)"
          value={editItem.maxStock}
          onChangeText={(text) => setEditItem({...editItem, maxStock: text})}
          keyboardType="numeric"
        />

        <Input
          placeholder="Description (Optional)"
          value={editItem.description}
          onChangeText={(text) => setEditItem({...editItem, description: text})}
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
            title={isSubmitting ? '' : 'Update Product'}
            onPress={handleUpdateItem} 
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