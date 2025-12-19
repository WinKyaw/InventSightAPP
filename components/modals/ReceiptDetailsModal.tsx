import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Receipt } from '../../types';
import { ReceiptService } from '../../services';
import { styles } from '../../constants/Styles';

interface ReceiptDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  onUpdate?: (receipt: Receipt) => void;
}

export function ReceiptDetailsModal({ visible, onClose, receipt, onUpdate }: ReceiptDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedCustomerName, setEditedCustomerName] = useState('');
  const [editedPaymentMethod, setEditedPaymentMethod] = useState('CASH');

  // Helper function to get item fields with fallback
  const getItemFields = (item: any) => ({
    name: item.productName || item.name || 'Unknown Product',
    price: item.unitPrice || item.price || 0,
    total: item.totalPrice || item.total || 0,
  });

  useEffect(() => {
    if (visible && receipt) {
      setEditedCustomerName(receipt.customerName || '');
      setEditedPaymentMethod(receipt.paymentMethod || 'CASH');
      setIsEditing(false);
    }
  }, [visible, receipt]);

  const handleUpdate = async () => {
    if (!receipt) return;

    try {
      setIsSubmitting(true);
      const updatedReceipt = await ReceiptService.updateReceipt(receipt.id, {
        customerName: editedCustomerName || 'Walk-in Customer',
        paymentMethod: editedPaymentMethod,
      });
      
      Alert.alert('Success', 'Receipt updated successfully');
      setIsEditing(false);
      if (onUpdate) {
        onUpdate(updatedReceipt);
      }
      onClose();
    } catch (error) {
      console.error('Failed to update receipt:', error);
      Alert.alert('Error', 'Failed to update receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print', 'Print functionality will be implemented with expo-print');
  };

  const handleShare = async () => {
    if (!receipt) return;

    const receiptText = formatReceiptForSharing(receipt);

    try {
      await Share.share({
        message: receiptText,
        title: `Receipt #${receipt.receiptNumber}`,
      });
    } catch (error) {
      console.error('Failed to share receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const formatReceiptForSharing = (receipt: Receipt): string => {
    let text = `================================\n`;
    text += `       RECEIPT\n`;
    text += `================================\n\n`;
    text += `Receipt #: ${receipt.receiptNumber}\n`;
    const dateStr = receipt.createdAt || receipt.dateTime;
    text += `Date: ${dateStr ? new Date(dateStr).toLocaleString() : 'N/A'}\n`;
    text += `Customer: ${receipt.customerName || 'Walk-in Customer'}\n`;
    text += `Payment: ${receipt.paymentMethod || 'N/A'}\n`;
    text += `================================\n\n`;
    text += `ITEMS:\n`;
    text += `--------------------------------\n`;
    
    receipt.items.forEach((item, index) => {
      const itemFields = getItemFields(item);
      text += `${index + 1}. ${itemFields.name}\n`;
      text += `   $${itemFields.price.toFixed(2)} x ${item.quantity} = $${itemFields.total.toFixed(2)}\n`;
    });
    
    text += `--------------------------------\n`;
    text += `Subtotal: $${receipt.subtotal.toFixed(2)}\n`;
    const tax = receipt.taxAmount || receipt.tax || 0;
    text += `Tax: $${tax.toFixed(2)}\n`;
    text += `================================\n`;
    const total = receipt.totalAmount || receipt.total || 0;
    text += `TOTAL: $${total.toFixed(2)}\n`;
    text += `================================\n`;
    text += `\nThank you for your business!\n`;
    
    return text;
  };

  if (!receipt) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Receipt Details">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Receipt Header */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.title}>#{receipt.receiptNumber}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: '#3B82F6' }]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: '#10B981' }]}
                onPress={handlePrint}
              >
                <Ionicons name="print-outline" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isEditing ? '#EF4444' : '#F59E0B' }]}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Ionicons name={isEditing ? 'close' : 'pencil-outline'} size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {receipt.createdAt 
                ? new Date(receipt.createdAt).toLocaleString()
                : receipt.dateTime
                ? new Date(receipt.dateTime).toLocaleString()
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#F59E0B" />
            <Text style={styles.infoLabel}>Customer:</Text>
            {isEditing ? (
              <Input
                value={editedCustomerName}
                onChangeText={setEditedCustomerName}
                placeholder="Customer name"
                style={{ flex: 1, marginLeft: 8 }}
              />
            ) : (
              <Text style={styles.infoValue}>{receipt.customerName || 'Walk-in Customer'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="wallet-outline" size={16} color="#F59E0B" />
            <Text style={styles.infoLabel}>Payment:</Text>
            {isEditing ? (
              <View style={{ flex: 1, flexDirection: 'row', gap: 4, marginLeft: 8 }}>
                {['CASH', 'CARD', 'MOBILE', 'OTHER'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: editedPaymentMethod === method ? '#FEF3C7' : '#F3F4F6',
                      borderWidth: 2,
                      borderColor: editedPaymentMethod === method ? '#F59E0B' : 'transparent',
                      alignItems: 'center',
                    }}
                    onPress={() => setEditedPaymentMethod(method)}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: editedPaymentMethod === method ? '#F59E0B' : '#6B7280',
                      }}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>{receipt.paymentMethod || 'N/A'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: '#10B981', fontWeight: '600' }]}>
              {receipt.status}
            </Text>
          </View>
        </View>

        {/* Items List */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.title, { marginBottom: 12 }]}>Items</Text>
          {receipt.items.map((item, index) => {
            const itemFields = getItemFields(item);
            return (
              <View
                key={`${item.id}-${index}`}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: index < receipt.items.length - 1 ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14 }}>{itemFields.name}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                    ${itemFields.price.toFixed(2)} × {item.quantity}
                  </Text>
                </View>
                <Text style={{ fontWeight: '600', fontSize: 14 }}>${itemFields.total.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Subtotal:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>${receipt.subtotal.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6B7280' }}>Tax:</Text>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>${(receipt.taxAmount || receipt.tax || 0).toFixed(2)}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTopWidth: 2,
              borderTopColor: '#F59E0B',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Total:</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#10B981' }}>
              ${(receipt.totalAmount || receipt.total || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View style={{ marginBottom: 16 }}>
            <Button
              title={isSubmitting ? 'Updating...' : 'Save Changes'}
              onPress={handleUpdate}
              disabled={isSubmitting}
              color="#10B981"
            />
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}
