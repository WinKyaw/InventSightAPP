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
import DatePicker from '../ui/DatePicker';
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

type ConditionType = 'GOOD' | 'DAMAGED' | 'PARTIAL';

interface ValidationErrors {
  receivedQuantity?: string;
  receiverName?: string;
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
    receivedAt: new Date().toISOString(),
    condition: 'GOOD',
    receiptNotes: '',
  });
  const [receivedDate, setReceivedDate] = useState<Date>(new Date());
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible && user) {
      const userName = user.name || user.email;
      setFormData({
        receivedQuantity: transfer.approvedQuantity || transfer.requestedQuantity,
        receiverName: userName,
        receivedAt: new Date().toISOString(),
        condition: 'GOOD',
        receiptNotes: '',
      });
      setReceivedDate(new Date());
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

    if (!formData.receiverName.trim()) {
      errors.receiverName = 'Receiver name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmReceipt = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      const receiptData: ReceiptDTO = {
        ...formData,
        receivedAt: receivedDate.toISOString(),
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

  const handleConditionChange = (condition: ConditionType) => {
    setFormData({ ...formData, condition });
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
            if (num < expectedQuantity && formData.condition === 'GOOD') {
              setFormData({ ...formData, receivedQuantity: num, condition: 'PARTIAL' });
            }
          }}
          keyboardType="numeric"
          error={validationErrors.receivedQuantity}
        />

        {/* Receiver Name */}
        <Input
          placeholder="Receiver name"
          value={formData.receiverName}
          onChangeText={(text) => setFormData({ ...formData, receiverName: text })}
          error={validationErrors.receiverName}
        />

        {/* Receipt Date/Time */}
        <DatePicker
          label="Receipt Date"
          value={receivedDate}
          onChange={(date) => {
            if (date) setReceivedDate(date);
          }}
          placeholder="Select receipt date"
          maximumDate={new Date()}
        />

        {/* Condition Checkboxes */}
        <Text style={styles.sectionTitle}>Condition</Text>
        <View style={styles.conditionContainer}>
          {[
            { value: 'GOOD', label: 'Good', icon: 'checkmark-circle', color: Colors.success },
            { value: 'DAMAGED', label: 'Damaged', icon: 'alert-circle', color: Colors.warning },
            { value: 'PARTIAL', label: 'Partial', icon: 'remove-circle', color: Colors.accent },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.conditionOption,
                formData.condition === option.value && styles.conditionOptionActive,
                formData.condition === option.value && {
                  backgroundColor: `${option.color}15`,
                  borderColor: option.color,
                },
              ]}
              onPress={() => handleConditionChange(option.value as ConditionType)}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={formData.condition === option.value ? option.color : Colors.lightGray}
              />
              <Text
                style={[
                  styles.conditionLabel,
                  formData.condition === option.value && { color: option.color },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Receipt Notes */}
        <Input
          placeholder="Receipt notes (optional)"
          value={formData.receiptNotes}
          onChangeText={(text) => setFormData({ ...formData, receiptNotes: text })}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Damage/Missing Notes */}
        {(formData.condition === 'DAMAGED' || formData.condition === 'PARTIAL') && (
          <>
            {formData.condition === 'DAMAGED' && (
              <Input
                placeholder="Damage details"
                value={formData.damageNotes}
                onChangeText={(text) => setFormData({ ...formData, damageNotes: text })}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            )}
            {formData.condition === 'PARTIAL' && (
              <Input
                placeholder="Missing items details"
                value={formData.missingItemsNotes}
                onChangeText={(text) => setFormData({ ...formData, missingItemsNotes: text })}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            )}
          </>
        )}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  conditionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  conditionOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  conditionOptionActive: {
    borderWidth: 2,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 8,
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
