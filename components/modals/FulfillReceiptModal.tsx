import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Modal } from '../ui/Modal';
import Ionicons from '@expo/vector-icons/Ionicons';
import apiClient from '../../services/api/apiClient';
import { Receipt } from '../../types';

interface FulfillReceiptModalProps {
  visible: boolean;
  receipt: Receipt | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const FulfillReceiptModal: React.FC<FulfillReceiptModalProps> = ({
  visible,
  receipt,
  onClose,
  onSuccess,
}) => {
  const [selectedType, setSelectedType] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFulfill = async () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select Pickup or Delivery');
      return;
    }

    if (!receipt?.id) {
      Alert.alert('Error', 'Invalid receipt');
      return;
    }

    try {
      setLoading(true);
      console.log(`✅ Fulfilling receipt ${receipt.id} as ${selectedType}`);

      // ✅ Send receiptType in request body
      await apiClient.post(`/api/receipts/${receipt.id}/fulfill`, {
        receiptType: selectedType,
      });

      Alert.alert(
        'Success', 
        `Receipt marked as ${selectedType === 'PICKUP' ? 'Ready for Pickup' : 'Out for Delivery'}`
      );
      
      onSuccess();
      onClose();
      setSelectedType(null); // Reset selection
    } catch (error) {
      console.error('❌ Error fulfilling receipt:', error);
      let errorMessage = 'Failed to fulfill receipt';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Fulfill Receipt">
      <View style={styles.container}>
        <Text style={styles.receiptNumber}>#{receipt?.receiptNumber}</Text>
        <Text style={styles.amount}>${(receipt?.totalAmount || 0).toFixed(2)}</Text>
        <Text style={styles.customer}>
          Customer: {receipt?.customerName || 'Walk-in Customer'}
        </Text>

        <Text style={styles.label}>Select Fulfillment Type: *</Text>

        <View style={styles.typeOptions}>
          {/* PICKUP Option */}
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === 'PICKUP' && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType('PICKUP')}
            disabled={loading}
          >
            <Ionicons
              name="cube-outline"
              size={40}
              color={selectedType === 'PICKUP' ? '#F97316' : '#6B7280'}
            />
            <Text
              style={[
                styles.typeText,
                selectedType === 'PICKUP' && styles.typeTextActive,
              ]}
            >
              Pickup
            </Text>
            <Text style={styles.typeDescription}>
              Customer will collect
            </Text>
          </TouchableOpacity>

          {/* DELIVERY Option */}
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === 'DELIVERY' && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType('DELIVERY')}
            disabled={loading}
          >
            <Ionicons
              name="bicycle-outline"
              size={40}
              color={selectedType === 'DELIVERY' ? '#F97316' : '#6B7280'}
            />
            <Text
              style={[
                styles.typeText,
                selectedType === 'DELIVERY' && styles.typeTextActive,
              ]}
            >
              Delivery
            </Text>
            <Text style={styles.typeDescription}>
              Send to customer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fulfill Button */}
        <TouchableOpacity
          style={[
            styles.fulfillButton,
            (!selectedType || loading) && styles.fulfillButtonDisabled
          ]}
          onPress={handleFulfill}
          disabled={!selectedType || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.fulfillButtonText}>Fulfill Receipt</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  receiptNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  customer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  typeButtonActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  typeText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  typeTextActive: {
    color: '#F97316',
  },
  typeDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fulfillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  fulfillButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  fulfillButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
