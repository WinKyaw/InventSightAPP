import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../services/api/apiClient';

interface PaymentModalProps {
  visible: boolean;
  receipt: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  receipt,
  onClose,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('CASH');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: 'cash' },
    { id: 'CARD', label: 'Card', icon: 'card' },
    { id: 'MOBILE', label: 'Mobile', icon: 'phone-portrait' },
    { id: 'OTHER', label: 'Other', icon: 'wallet' },
  ];

  const handleCompletePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!receipt?.id) {
      Alert.alert('Error', 'Invalid receipt');
      return;
    }

    try {
      setLoading(true);
      console.log(`💳 Completing payment for receipt ${receipt.id} with method: ${selectedMethod}`);

      await apiClient.put(`/api/receipts/${receipt.id}/complete`, {
        paymentMethod: selectedMethod,
      });

      Alert.alert('Success', 'Payment completed successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error completing payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.receiptInfo}>Receipt #{receipt?.receiptNumber || 'N/A'}</Text>
          <Text style={styles.totalAmount}>Total: ${receipt?.total?.toFixed(2) || receipt?.totalAmount?.toFixed(2) || '0.00'}</Text>

          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  selectedMethod === method.id && styles.methodButtonActive,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={selectedMethod === method.id ? '#E67E22' : '#999'}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    selectedMethod === method.id && styles.methodLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.completeButton, loading && styles.completeButtonDisabled]}
            onPress={handleCompletePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.completeButtonText}>Complete Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E67E22',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    gap: 8,
  },
  methodButtonActive: {
    borderColor: '#E67E22',
    backgroundColor: '#FFF8F0',
  },
  methodLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  methodLabelActive: {
    color: '#E67E22',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#E67E22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
