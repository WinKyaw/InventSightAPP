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
import { markAsDelivered } from '../../services/api/transferRequestService';
import { Colors } from '../../constants/Colors';

interface MarkDeliveredModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

export function MarkDeliveredModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: MarkDeliveredModalProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible) {
      setNotes('');
    }
  }, [transfer, visible]);

  const handleMarkDelivered = async () => {
    if (!transfer) return;

    setLoading(true);
    try {
      await markAsDelivered(transfer.id, {
        notes: notes.trim() || undefined,
      });
      Alert.alert('Success', 'Transfer marked as delivered');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
      Alert.alert('Error', 'Failed to mark as delivered. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Mark as Delivered">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Transfer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product'}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity:</Text>
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
          {(transfer.carrier || transfer.carrierName) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Carrier:</Text>
              <Text style={styles.infoValue}>{transfer.carrier?.name || transfer.carrierName}</Text>
            </View>
          )}
        </View>

        {/* Delivery Notes */}
        <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
        <Input
          placeholder="Add any delivery notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        {/* Info Card */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={Colors.success} />
          <Text style={styles.infoNoteText}>
            This will mark the transfer as delivered to the destination. The receiver can then confirm receipt.
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
            title={loading ? 'Processing...' : 'Mark Delivered'}
            onPress={handleMarkDelivered}
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
    backgroundColor: '#D1FAE5',
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
