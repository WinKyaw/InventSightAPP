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
  const [markingStatus, setMarkingStatus] = useState(false);

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: 'cash' },
    { id: 'CARD', label: 'Card', icon: 'card' },
    { id: 'MOBILE', label: 'Mobile', icon: 'phone-portrait' },
    { id: 'OTHER', label: 'Other', icon: 'wallet' },
  ];

  // Check if receipt is already completed
  const isCompleted = receipt?.status === 'COMPLETED' || receipt?.status === 'PAID';

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

      // ✅ FIX: Set status to PAID (not FULFILLED) - payment doesn't mean fulfillment
      await apiClient.put(`/api/receipts/${receipt.id}/complete`, {
        paymentMethod: selectedMethod,
        status: 'PAID', // ✅ Mark as PAID, not FULFILLED
      });

      Alert.alert('Success', 'Payment completed - receipt marked as PAID');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error completing payment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDelivery = async () => {
    if (!receipt?.id) {
      Alert.alert('Error', 'Invalid receipt');
      return;
    }

    try {
      setMarkingStatus(true);
      console.log(`🚴 Marking receipt ${receipt.id} as delivery`);
      
      await apiClient.put(`/api/receipts/${receipt.id}`, {
        receiptType: 'DELIVERY',
      });

      Alert.alert('Success', 'Receipt marked as delivery');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error marking as delivery:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark as delivery');
    } finally {
      setMarkingStatus(false);
    }
  };

  const handleMarkAsPickup = async () => {
    if (!receipt?.id) {
      Alert.alert('Error', 'Invalid receipt');
      return;
    }

    try {
      setMarkingStatus(true);
      console.log(`👜 Marking receipt ${receipt.id} as pickup`);
      
      await apiClient.put(`/api/receipts/${receipt.id}`, {
        receiptType: 'PICKUP',
      });

      Alert.alert('Success', 'Receipt marked as pickup');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error marking as pickup:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark as pickup');
    } finally {
      setMarkingStatus(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isCompleted ? '✅ Payment Completed' : 'Complete Payment'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.receiptInfo}>Receipt #{receipt?.receiptNumber || 'N/A'}</Text>
          <Text style={styles.totalAmount}>Total: ${receipt?.total?.toFixed(2) || receipt?.totalAmount?.toFixed(2) || '0.00'}</Text>

          {isCompleted ? (
            // Show payment summary for completed receipts
            <>
              <View style={styles.paymentSummary}>
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.infoText}>Status: {receipt?.status || 'COMPLETED'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={20} color="#F59E0B" />
                  <Text style={styles.infoText}>Payment Method: {receipt?.paymentMethod || 'CASH'}</Text>
                </View>
                
                {receipt?.fulfilledByName && (
                  <View style={styles.infoRow}>
                    <Ionicons name="person" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>Completed by: {receipt.fulfilledByName}</Text>
                  </View>
                )}
                
                {receipt?.fulfilledAt && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>
                      Completed at: {new Date(receipt.fulfilledAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Next Steps Section */}
              <View style={styles.nextStepsSection}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deliveryButton]}
                  onPress={handleMarkAsDelivery}
                  disabled={markingStatus}
                >
                  {markingStatus ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="bicycle" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Mark as Delivery</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.pickupButton]}
                  onPress={handleMarkAsPickup}
                  disabled={markingStatus}
                >
                  {markingStatus ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="bag-handle" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Mark as Pickup</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Show payment form for pending receipts
            <>
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
            </>
          )}
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
  paymentSummary: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  nextStepsSection: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  deliveryButton: {
    backgroundColor: '#3B82F6',
  },
  pickupButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
