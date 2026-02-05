import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { approveTransfer } from '../../services/api/transferRequestService';

interface ApproveTransferModalProps {
  visible: boolean;
  transferId: string;
  requestedQuantity: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApproveTransferModal({
  visible,
  transferId,
  requestedQuantity,
  onClose,
  onSuccess,
}: ApproveTransferModalProps) {
  const [approvedQuantity, setApprovedQuantity] = useState(requestedQuantity.toString());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    // Validation
    const quantity = parseInt(approvedQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (quantity > requestedQuantity) {
      Alert.alert(
        'Quantity Too High',
        `Approved quantity cannot exceed requested quantity (${requestedQuantity})`
      );
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔄 Approving transfer:', {
        transferId,
        approvedQuantity: quantity,
        notes,
      });

      await approveTransfer(transferId, quantity, notes);

      Alert.alert(
        'Transfer Approved',
        'The transfer has been approved. It will be ready for pickup once items are packed.',
        [{ text: 'OK', onPress: () => {
          onClose();
          onSuccess();
        }}]
      );
    } catch (error: any) {
      console.error('❌ Error approving transfer:', error);
      Alert.alert(
        'Approval Failed',
        error.message || 'Failed to approve transfer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Approve Transfer</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Approved Quantity */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Approved Quantity <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.hint}>
                Requested: {requestedQuantity} units
              </Text>
              <TextInput
                style={styles.input}
                value={approvedQuantity}
                onChangeText={setApprovedQuantity}
                keyboardType="numeric"
                placeholder="Enter approved quantity"
                editable={!loading}
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>Approval Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this approval"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            {/* Info Message */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                After approval, warehouse staff will pack the items and mark them as ready for pickup.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.approveButton]}
              onPress={handleApprove}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  required: {
    color: Colors.danger,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
