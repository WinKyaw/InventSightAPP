import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TransferRequest } from '../../types/transfer';
import { rejectTransfer } from '../../services/api/transferRequestService';
import { Colors } from '../../constants/Colors';

interface RejectTransferModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

interface ValidationErrors {
  reason?: string;
}

export function RejectTransferModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: RejectTransferModalProps) {
  const [reason, setReason] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible) {
      setReason('');
      setValidationErrors({});
    }
  }, [transfer, visible]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!reason.trim()) {
      errors.reason = 'Rejection reason is required';
    } else if (reason.trim().length < 10) {
      errors.reason = 'Please provide a detailed reason (at least 10 characters)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReject = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      await rejectTransfer(transfer.id, reason.trim());
      Alert.alert('Rejected', 'Transfer request has been rejected');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to reject transfer:', error);
      Alert.alert('Error', 'Failed to reject transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Reject Transfer">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Transfer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested:</Text>
            <Text style={styles.infoValue}>{transfer.requestedQuantity} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>
              {transfer.fromLocation?.name || transfer.fromWarehouse?.name || transfer.fromStore?.name || 'Unknown'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>
              {transfer.toLocation?.name || transfer.toWarehouse?.name || transfer.toStore?.name || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Rejection Reason */}
        <Text style={styles.sectionTitle}>Rejection Reason *</Text>
        <Input
          placeholder="Enter detailed reason for rejection"
          value={reason}
          onChangeText={(text) => setReason(text)}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          error={validationErrors.reason}
        />

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.warningText}>
            This action cannot be undone. The requester will be notified of the rejection.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Rejecting...' : 'Reject Transfer'}
            onPress={handleReject}
            color={Colors.danger}
            disabled={loading}
            style={styles.rejectButton}
            leftIcon={
              loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
              )
            }
          />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 500,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  rejectButton: {
    flex: 1.5,
  },
});
