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
import { TransferRequest } from '../../types/transfer';
import { startDelivery } from '../../services/api/transferRequestService';
import { Colors } from '../../constants/Colors';

interface StartDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  transfer: TransferRequest | null;
  onSuccess: () => void;
}

interface ValidationErrors {
  carrierName?: string;
  carrierPhone?: string;
}

export function StartDeliveryModal({
  visible,
  onClose,
  transfer,
  onSuccess,
}: StartDeliveryModalProps) {
  const [formData, setFormData] = useState({
    carrierName: '',
    carrierPhone: '',
    carrierVehicle: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transfer && visible) {
      setFormData({
        carrierName: '',
        carrierPhone: '',
        carrierVehicle: '',
      });
      setValidationErrors({});
    }
  }, [transfer, visible]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.carrierName.trim()) {
      errors.carrierName = 'Carrier name is required';
    }

    if (formData.carrierPhone && !/^[\d\s\-\+\(\)]+$/.test(formData.carrierPhone)) {
      errors.carrierPhone = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartDelivery = async () => {
    if (!transfer || !validateForm()) return;

    setLoading(true);
    try {
      await startDelivery(transfer.id, {
        carrierName: formData.carrierName.trim(),
        carrierPhone: formData.carrierPhone.trim() || undefined,
        carrierVehicle: formData.carrierVehicle.trim() || undefined,
      });
      Alert.alert('Success', 'Delivery started - transfer is now in transit');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to start delivery:', error);
      Alert.alert('Error', 'Failed to start delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  return (
    <Modal visible={visible} onClose={onClose} title="Start Delivery">
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
        </View>

        {/* Carrier Information */}
        <Text style={styles.sectionTitle}>Carrier Information</Text>

        <Input
          placeholder="Carrier name *"
          value={formData.carrierName}
          onChangeText={(text) => setFormData({ ...formData, carrierName: text })}
          error={validationErrors.carrierName}
        />

        <Input
          placeholder="Carrier phone"
          value={formData.carrierPhone}
          onChangeText={(text) => setFormData({ ...formData, carrierPhone: text })}
          keyboardType="phone-pad"
          error={validationErrors.carrierPhone}
        />

        <Input
          placeholder="Vehicle/Tracking number"
          value={formData.carrierVehicle}
          onChangeText={(text) => setFormData({ ...formData, carrierVehicle: text })}
        />

        {/* Info Card */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoNoteText}>
            This will mark the transfer as picked up and in transit to the destination.
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
            title={loading ? 'Processing...' : 'Start Delivery'}
            onPress={handleStartDelivery}
            color={Colors.primary}
            disabled={loading}
            style={styles.confirmButton}
            leftIcon={
              loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Ionicons name="car-outline" size={20} color={Colors.white} />
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
  confirmButton: {
    flex: 1.5,
  },
});
