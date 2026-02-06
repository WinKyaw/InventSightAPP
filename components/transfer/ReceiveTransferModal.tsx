import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TransferRequest, ReceiptDTO } from '../../types/transfer';
import { confirmReceipt } from '../../services/api/transferRequestService';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

interface ReceiveTransferModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

interface ValidationErrors {
  receivedQuantity?: string;
  damagedQuantity?: string;
}

export function ReceiveTransferModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: ReceiveTransferModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ReceiptDTO>({
    receivedQuantity: 0,
    receiverName: '',
    receiptNotes: '',
    damageReported: false,
    damagedQuantity: 0,
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible && user) {
      const userName = user.name || user.email;
      setFormData({
        receivedQuantity: transfer.approvedQuantity || transfer.requestedQuantity,
        receiverName: userName,
        receiptNotes: '',
        damageReported: false,
        damagedQuantity: 0,
      });
      setValidationErrors({});
    }
  }, [transfer, visible, user]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.receivedQuantity || formData.receivedQuantity <= 0) {
      errors.receivedQuantity = 'Received quantity must be greater than 0';
    } else if (transfer && formData.receivedQuantity > (transfer.approvedQuantity || transfer.requestedQuantity)) {
      const max = transfer.approvedQuantity || transfer.requestedQuantity;
      errors.receivedQuantity = `Cannot exceed approved quantity (${max})`;
    }

    if (formData.damagedQuantity && formData.damagedQuantity < 0) {
      errors.damagedQuantity = 'Damaged quantity cannot be negative';
    } else if (formData.damagedQuantity && formData.receivedQuantity && formData.damagedQuantity > formData.receivedQuantity) {
      errors.damagedQuantity = 'Damaged quantity cannot exceed received quantity';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmReceipt = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      const receiptData: ReceiptDTO = {
        receivedQuantity: formData.receivedQuantity,
        receiverName: formData.receiverName,
        receiptNotes: formData.receiptNotes,
        damageReported: (formData.damagedQuantity || 0) > 0,
        damagedQuantity: formData.damagedQuantity || 0,
        receiverSignatureUrl: formData.receiverSignatureUrl,
        deliveryQRCode: formData.deliveryQRCode,
      };

      await confirmReceipt(transfer.id, receiptData);
      Alert.alert('Success', 'Transfer receipt confirmed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
      Alert.alert('Error', 'Failed to confirm receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  const expectedQuantity = transfer.approvedQuantity || transfer.requestedQuantity;

  return (
    <Modal visible={visible} onClose={onClose} title="Receive Transfer">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Transfer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Quantity:</Text>
            <Text style={styles.infoValue}>{expectedQuantity} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>
              {transfer.fromLocation?.name || transfer.fromWarehouse?.name || transfer.fromStore?.name || 'Unknown'}
            </Text>
          </View>
          {(transfer.carrier || transfer.carrierName) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Carrier:</Text>
              <Text style={styles.infoValue}>{transfer.carrier?.name || transfer.carrierName}</Text>
            </View>
          )}
        </View>

        {/* Received Quantity */}
        <Input
          placeholder="Received quantity"
          value={formData.receivedQuantity.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setFormData({ ...formData, receivedQuantity: num });
          }}
          keyboardType="numeric"
          error={validationErrors.receivedQuantity}
        />

        {/* Receiver Name */}
        <Input
          placeholder="Receiver name (optional)"
          value={formData.receiverName}
          onChangeText={(text) => setFormData({ ...formData, receiverName: text })}
        />

        {/* Damaged Quantity */}
        <Input
          placeholder="Damaged quantity (optional)"
          value={formData.damagedQuantity?.toString() || '0'}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setFormData({ 
              ...formData, 
              damagedQuantity: num,
              damageReported: num > 0
            });
          }}
          keyboardType="numeric"
          error={validationErrors.damagedQuantity}
        />

        {/* Receipt Notes */}
        <Input
          placeholder="Receipt notes (optional)"
          value={formData.receiptNotes}
          onChangeText={(text) => setFormData({ ...formData, receiptNotes: text })}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Action Button */}
        <Button
          title={loading ? 'Processing...' : 'Confirm Receipt'}
          onPress={handleConfirmReceipt}
          color={Colors.success}
          disabled={loading}
          style={styles.confirmButton}
          leftIcon={
            loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="checkmark-done-outline" size={20} color={Colors.white} />
            )
          }
        />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 600,
  },
  infoCard: {
    backgroundColor: Colors.lightBlue,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  confirmButton: {
    marginTop: 20,
    marginBottom: 8,
  },
});
