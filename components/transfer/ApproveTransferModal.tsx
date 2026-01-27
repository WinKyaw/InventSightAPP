import React, { useState } from 'react';
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
import DatePicker from '../ui/DatePicker';
import { TransferRequest, SendTransferDTO } from '../../types/transfer';
import { approveAndSendTransfer, rejectTransfer } from '../../services/api/transferRequestService';
import { Colors } from '../../constants/Colors';

interface ApproveTransferModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

interface ValidationErrors {
  approvedQuantity?: string;
  carrierName?: string;
  carrierPhone?: string;
}

export function ApproveTransferModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: ApproveTransferModalProps) {
  const [formData, setFormData] = useState<SendTransferDTO>({
    approvedQuantity: transfer?.requestedQuantity || 0,
    carrierName: '',
    carrierPhone: '',
    carrierVehicle: '',
    estimatedDeliveryAt: '',
    approvalNotes: '',
  });
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (transfer && visible) {
      setFormData({
        approvedQuantity: transfer.requestedQuantity,
        carrierName: '',
        carrierPhone: '',
        carrierVehicle: '',
        estimatedDeliveryAt: '',
        approvalNotes: '',
      });
      setEstimatedDeliveryDate(null);
      setValidationErrors({});
    }
  }, [transfer, visible]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.approvedQuantity || formData.approvedQuantity <= 0) {
      errors.approvedQuantity = 'Approved quantity must be greater than 0';
    } else if (transfer && formData.approvedQuantity > transfer.requestedQuantity) {
      errors.approvedQuantity = `Cannot exceed requested quantity (${transfer.requestedQuantity})`;
    }

    if (!formData.carrierName.trim()) {
      errors.carrierName = 'Carrier name is required';
    }

    if (formData.carrierPhone && !/^[\d\s\-\+\(\)]+$/.test(formData.carrierPhone)) {
      errors.carrierPhone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApprove = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      const sendData: SendTransferDTO = {
        ...formData,
        estimatedDeliveryAt: estimatedDeliveryDate
          ? estimatedDeliveryDate.toISOString()
          : undefined,
      };

      await approveAndSendTransfer(transfer.id, sendData);
      Alert.alert('Success', 'Transfer approved and sent successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to approve transfer:', error);
      Alert.alert('Error', 'Failed to approve transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    if (!transfer) return;

    Alert.alert(
      'Reject Transfer',
      'Are you sure you want to reject this transfer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const reason = formData.approvalNotes || 'Request rejected';
              await rejectTransfer(transfer.id, reason);
              Alert.alert('Rejected', 'Transfer request has been rejected');
              onSuccess();
              onClose();
            } catch (error) {
              console.error('Failed to reject transfer:', error);
              Alert.alert('Error', 'Failed to reject transfer. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Approve Transfer">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Transfer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{transfer.item.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested:</Text>
            <Text style={styles.infoValue}>{transfer.requestedQuantity} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{transfer.fromLocation.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>{transfer.toLocation.name}</Text>
          </View>
        </View>

        {/* Approved Quantity */}
        <Input
          placeholder="Approved quantity"
          value={formData.approvedQuantity.toString()}
          onChangeText={(text) => {
            const num = parseInt(text) || 0;
            setFormData({ ...formData, approvedQuantity: num });
          }}
          keyboardType="numeric"
          error={validationErrors.approvedQuantity}
        />

        {/* Carrier Information */}
        <Text style={styles.sectionTitle}>Carrier Information</Text>

        <Input
          placeholder="Carrier name"
          value={formData.carrierName}
          onChangeText={(text) => setFormData({ ...formData, carrierName: text })}
          error={validationErrors.carrierName}
        />

        <Input
          placeholder="Carrier phone (optional)"
          value={formData.carrierPhone}
          onChangeText={(text) => setFormData({ ...formData, carrierPhone: text })}
          keyboardType="phone-pad"
          error={validationErrors.carrierPhone}
        />

        <Input
          placeholder="Vehicle/Tracking number (optional)"
          value={formData.carrierVehicle}
          onChangeText={(text) => setFormData({ ...formData, carrierVehicle: text })}
        />

        {/* Estimated Delivery */}
        <DatePicker
          label="Estimated Delivery (optional)"
          value={estimatedDeliveryDate}
          onChange={setEstimatedDeliveryDate}
          placeholder="Select delivery date"
          minimumDate={new Date()}
        />

        {/* Approval Notes */}
        <Input
          placeholder="Approval notes (optional)"
          value={formData.approvalNotes}
          onChangeText={(text) => setFormData({ ...formData, approvalNotes: text })}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleReject}
            disabled={loading}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Processing...' : 'Approve & Send'}
            onPress={handleApprove}
            color={Colors.success}
            disabled={loading}
            style={styles.approveButton}
            leftIcon={
              loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  approveButton: {
    flex: 1.5,
  },
});
