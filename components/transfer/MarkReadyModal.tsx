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
import { markAsReady } from '../../services/api/transferRequestService';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

interface MarkReadyModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

interface ValidationErrors {
  packedBy?: string;
}

export function MarkReadyModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: MarkReadyModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    packedBy: '',
    notes: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible && user) {
      const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email;
      setFormData({
        packedBy: userName,
        notes: '',
      });
      setValidationErrors({});
    }
  }, [transfer, visible, user]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.packedBy.trim()) {
      errors.packedBy = 'Packer name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMarkReady = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      await markAsReady(transfer.id, {
        packedBy: formData.packedBy.trim(),
        notes: formData.notes.trim() || undefined,
      });
      Alert.alert('Success', 'Transfer marked as ready for pickup');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to mark transfer as ready:', error);
      Alert.alert('Error', 'Failed to mark transfer as ready. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Mark as Ready">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Transfer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Approved Quantity:</Text>
            <Text style={styles.infoValue}>{transfer.approvedQuantity || transfer.requestedQuantity} units</Text>
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

        {/* Packer Name */}
        <Text style={styles.sectionTitle}>Packed By *</Text>
        <Input
          placeholder="Enter packer name"
          value={formData.packedBy}
          onChangeText={(text) => setFormData({ ...formData, packedBy: text })}
          error={validationErrors.packedBy}
        />

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <Input
          placeholder="Add any special handling notes"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {/* Info Card */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoNoteText}>
            This will mark the transfer as packed and ready for carrier pickup.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            disabled={loading}
            style={styles.cancelButton}
          />

          <Button
            title={loading ? 'Processing...' : 'Mark as Ready'}
            onPress={handleMarkReady}
            color={Colors.success}
            disabled={loading}
            style={styles.confirmButton}
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
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  infoNoteText: {
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
  },
  confirmButton: {
    flex: 1.5,
  },
});
