import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useItemsApi } from '../../context/ItemsApiContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Product, UpdateStockRequest } from '../../services/api/config';
import { styles } from '../../constants/Styles';

interface StockManagementModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

export function StockManagementModal({ visible, onClose, product }: StockManagementModalProps) {
  const { updateProductStock } = useItemsApi();
  const [operation, setOperation] = useState<'SET' | 'ADD' | 'SUBTRACT'>('ADD');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setOperation('ADD');
      setQuantity('');
      setReason('');
    }
  }, [visible]);

  const handleUpdateStock = async () => {
    if (!product) return;

    if (!quantity) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    const qtyValue = parseInt(quantity);
    if (isNaN(qtyValue) || qtyValue <= 0) {
      Alert.alert('Error', 'Please enter a valid positive quantity');
      return;
    }

    // Check if operation would result in negative stock
    if (operation === 'SUBTRACT' && qtyValue > product.quantity) {
      Alert.alert('Error', `Cannot subtract ${qtyValue} units. Current stock is only ${product.quantity} units.`);
      return;
    }

    if (operation === 'SET' && qtyValue < 0) {
      Alert.alert('Error', 'Stock quantity cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);

      const stockData: UpdateStockRequest = {
        quantity: qtyValue,
        operation: operation,
        reason: reason || undefined
      };

      await updateProductStock(product.id, stockData);
      onClose();
    } catch (error) {
      console.error('Failed to update stock:', error);
      // Error alert is handled in the context
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewQuantity = () => {
    if (!product || !quantity) return product?.quantity || 0;
    
    const qtyValue = parseInt(quantity);
    if (isNaN(qtyValue)) return product.quantity;

    switch (operation) {
      case 'SET':
        return qtyValue;
      case 'ADD':
        return product.quantity + qtyValue;
      case 'SUBTRACT':
        return Math.max(0, product.quantity - qtyValue);
      default:
        return product.quantity;
    }
  };

  if (!product) return null;

  const operationOptions = [
    { key: 'ADD', label: 'Add Stock', icon: 'add-circle-outline', color: '#10B981' },
    { key: 'SUBTRACT', label: 'Remove Stock', icon: 'remove-circle-outline', color: '#EF4444' },
    { key: 'SET', label: 'Set Stock', icon: 'create-outline', color: '#3B82F6' }
  ];

  const previewQuantity = getPreviewQuantity();
  const isLowStock = previewQuantity <= (product.minStock || 10);

  return (
    <Modal visible={visible} onClose={onClose} title="Manage Stock">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.stockInfoCard}>
          <View style={styles.stockInfoRow}>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Product</Text>
              <Text style={styles.stockInfoValue}>{product.name}</Text>
            </View>
            <View style={styles.stockInfoItem}>
              <Text style={styles.stockInfoLabel}>Current Stock</Text>
              <Text style={styles.stockInfoValue}>{product.quantity} units</Text>
            </View>
          </View>
          
          <View style={styles.stockPreview}>
            <Text style={styles.stockPreviewLabel}>New Stock Level:</Text>
            <Text style={[
              styles.stockPreviewValue, 
              { color: isLowStock ? '#EF4444' : '#10B981' }
            ]}>
              {previewQuantity} units
            </Text>
            {isLowStock && (
              <Text style={styles.lowStockWarning}>⚠️ Low Stock Warning</Text>
            )}
          </View>
        </View>

        <View style={styles.operationSelector}>
          <Text style={styles.sectionTitle}>Operation</Text>
          <View style={styles.operationOptions}>
            {operationOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.operationOption,
                  operation === option.key && styles.operationOptionSelected,
                  operation === option.key && { borderColor: option.color }
                ]}
                onPress={() => setOperation(option.key as any)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={operation === option.key ? option.color : '#6B7280'} 
                />
                <Text style={[
                  styles.operationOptionText,
                  operation === option.key && { color: option.color }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          placeholder={operation === 'SET' ? 'New stock quantity' : 'Quantity to ' + (operation === 'ADD' ? 'add' : 'remove')}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        <Input
          placeholder="Reason for stock change (Optional)"
          value={reason}
          onChangeText={setReason}
          multiline={true}
          numberOfLines={2}
          style={{ height: 60, textAlignVertical: 'top' }}
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
            title={isSubmitting ? '' : 'Update Stock'}
            onPress={handleUpdateStock} 
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