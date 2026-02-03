import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTransferRequest } from '../../hooks/useTransferRequests';
import { useTransferPermissions } from '../../hooks/useTransferPermissions';
import { TransferStatusBadge } from '../../components/transfer/TransferStatusBadge';
import { TransferTimeline } from '../../components/transfer/TransferTimeline';
import { ApproveTransferModal } from '../../components/transfer/ApproveTransferModal';
import { RejectTransferModal } from '../../components/transfer/RejectTransferModal';
import { MarkReadyModal } from '../../components/transfer/MarkReadyModal';
import { StartDeliveryModal } from '../../components/transfer/StartDeliveryModal';
import { MarkDeliveredModal } from '../../components/transfer/MarkDeliveredModal';
import { ReceiveTransferModal } from '../../components/transfer/ReceiveTransferModal';
import { Header } from '../../components/shared/Header';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { TransferStatus, TransferPriority } from '../../types/transfer';
import { cancelTransfer } from '../../services/api/transferRequestService';

export default function TransferDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  
  // Log the ID for debugging
  console.log('📦 Transfer Detail - ID from params:', id);
  
  const { transfer, loading, error, refresh, setTransfer } = useTransferRequest(id);
  const {
    canApproveTransfer,
    canRejectTransfer,
    canMarkAsReady,
    canStartDelivery,
    canMarkAsDelivered,
    canCancelTransfer,
    canReceiveTransfer,
  } = useTransferPermissions();

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Check authentication
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  const handleCancelTransfer = () => {
    if (!transfer) return;

    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this transfer request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const reason = 'Cancelled by requester';
              const updated = await cancelTransfer(transfer.id, reason);
              setTransfer(updated);
              Alert.alert('Success', 'Transfer request cancelled');
            } catch (err) {
              console.error('Error cancelling transfer:', err);
              Alert.alert('Error', 'Failed to cancel transfer request');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleApproveSuccess = () => {
    setShowApproveModal(false);
    refresh();
  };

  const handleRejectSuccess = () => {
    setShowRejectModal(false);
    refresh();
  };

  const handleReadySuccess = () => {
    setShowReadyModal(false);
    refresh();
  };

  const handleDeliverySuccess = () => {
    setShowDeliveryModal(false);
    refresh();
  };

  const handleDeliveredSuccess = () => {
    setShowDeliveredModal(false);
    refresh();
  };

  const handleReceiveSuccess = () => {
    setShowReceiveModal(false);
    refresh();
  };

  const getPriorityColor = (priority: TransferPriority) => {
    switch (priority) {
      case TransferPriority.HIGH:
        return Colors.danger;
      case TransferPriority.MEDIUM:
        return Colors.warning;
      case TransferPriority.LOW:
        return Colors.success;
      default:
        return Colors.gray;
    }
  };

  const getPriorityIcon = (priority: TransferPriority) => {
    switch (priority) {
      case TransferPriority.HIGH:
        return 'alert-circle';
      case TransferPriority.MEDIUM:
        return 'alert';
      case TransferPriority.LOW:
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  // Construct timeline from either nested timeline or flat fields
  const getTimeline = () => {
    if (transfer?.timeline) {
      return transfer.timeline;
    }
    // Construct from flat fields
    return {
      requestedAt: transfer?.requestedAt || '',
      requestedBy: transfer?.requestedBy || undefined,
      approvedAt: transfer?.approvedAt || undefined,
      approvedBy: transfer?.approvedBy || undefined,
      shippedAt: transfer?.shippedAt || undefined,
      estimatedDeliveryAt: transfer?.estimatedDeliveryAt || undefined,
      deliveredAt: transfer?.receivedAt || undefined, // Backend uses receivedAt for delivery
      receivedAt: transfer?.receivedAt || undefined,
      receivedBy: transfer?.receivedByUser || undefined,
    };
  };

  /**
   * Get FROM location name from nested object
   */
  const getFromLocationName = (): string => {
    if (!transfer) return 'Unknown';
    
    console.log('🔍 FROM location data:', {
      type: transfer.fromLocationType,
      warehouse: transfer.fromWarehouse,
      store: transfer.fromStore,
    });
    
    // Check nested objects with proper field names
    if (transfer.fromLocationType === 'WAREHOUSE' && transfer.fromWarehouse) {
      return transfer.fromWarehouse.name || 
             transfer.fromWarehouse.warehouseName || 
             'Unknown Warehouse';
    }
    
    if (transfer.fromLocationType === 'STORE' && transfer.fromStore) {
      return transfer.fromStore.storeName || 
             transfer.fromStore.name || 
             'Unknown Store';
    }
    
    // Fallback to old structure
    if (transfer.fromLocation?.name) {
      return transfer.fromLocation.name;
    }
    
    return 'Unknown Location';
  };

  /**
   * Get TO location name from nested object
   */
  const getToLocationName = (): string => {
    if (!transfer) return 'Unknown';
    
    console.log('🔍 TO location data:', {
      type: transfer.toLocationType,
      warehouse: transfer.toWarehouse,
      store: transfer.toStore,
    });
    
    // Check nested objects with proper field names
    if (transfer.toLocationType === 'WAREHOUSE' && transfer.toWarehouse) {
      return transfer.toWarehouse.name || 
             transfer.toWarehouse.warehouseName || 
             'Unknown Warehouse';
    }
    
    if (transfer.toLocationType === 'STORE' && transfer.toStore) {
      return transfer.toStore.storeName || 
             transfer.toStore.name || 
             'Unknown Store';
    }
    
    // Fallback to old structure
    if (transfer.toLocation?.name) {
      return transfer.toLocation.name;
    }
    
    return 'Unknown Location';
  };

  /**
   * Get product name
   */
  const getProductName = (): string => {
    if (!transfer) return 'Unknown Product';
    return transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product';
  };

  /**
   * Get product SKU
   */
  const getProductSku = (): string => {
    if (!transfer) return 'N/A';
    return transfer.productSku || transfer.itemSku || transfer.item?.sku || 'N/A';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Transfer Details" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transfer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !transfer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Transfer Details" showBackButton />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorText}>
            {error || 'Transfer request not found'}
          </Text>
          <Button title="Retry" onPress={refresh} />
        </View>
      </SafeAreaView>
    );
  }

  const showApproveButton = canApproveTransfer(transfer);
  const showRejectButton = canRejectTransfer(transfer);
  const showReadyButton = canMarkAsReady(transfer);
  const showDeliveryButton = canStartDelivery(transfer);
  const showDeliveredButton = canMarkAsDelivered(transfer);
  const showReceiveButton = canReceiveTransfer(transfer);
  const showCancelButton = canCancelTransfer(transfer);

  // Create display ID (first 8 characters of UUID)
  const displayId = id ? id.substring(0, 8) : 'Unknown';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title={`Transfer #${displayId}`} showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <TransferStatusBadge status={transfer.status} size="large" />
          <View style={[styles.priorityBadge, { borderColor: getPriorityColor(transfer.priority) }]}>
            <Ionicons
              name={getPriorityIcon(transfer.priority) as any}
              size={16}
              color={getPriorityColor(transfer.priority)}
            />
            <Text style={[styles.priorityText, { color: getPriorityColor(transfer.priority) }]}>
              {transfer.priority} Priority
            </Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfer Route</Text>
          
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons
                name={(transfer.fromLocation?.type || transfer.fromLocationType) === 'WAREHOUSE' ? 'business' : 'storefront'}
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.locationLabel}>From</Text>
            </View>
            <Text style={styles.locationName}>
              {getFromLocationName()}
            </Text>
            {(transfer.fromLocation?.address || transfer.fromWarehouse?.address || transfer.fromStore?.address) && (
              <Text style={styles.locationAddress}>
                {transfer.fromLocation?.address || transfer.fromWarehouse?.address || transfer.fromStore?.address}
              </Text>
            )}
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={24} color={Colors.primary} />
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons
                name={(transfer.toLocation?.type || transfer.toLocationType) === 'WAREHOUSE' ? 'business' : 'storefront'}
                size={20}
                color={Colors.success}
              />
              <Text style={styles.locationLabel}>To</Text>
            </View>
            <Text style={styles.locationName}>
              {getToLocationName()}
            </Text>
            {(transfer.toLocation?.address || transfer.toWarehouse?.address || transfer.toStore?.address) && (
              <Text style={styles.locationAddress}>
                {transfer.toLocation?.address || transfer.toWarehouse?.address || transfer.toStore?.address}
              </Text>
            )}
          </View>
        </View>

        {/* Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          
          <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Ionicons name="cube" size={24} color={Colors.primary} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>
                  {getProductName()}
                </Text>
                <Text style={styles.itemSku}>
                  SKU: {getProductSku()}
                </Text>
              </View>
            </View>

            <View style={styles.quantityRow}>
              <View style={styles.quantityItem}>
                <Text style={styles.quantityLabel}>Requested</Text>
                <Text style={styles.quantityValue}>{transfer.requestedQuantity || 0} units</Text>
              </View>
              {transfer.approvedQuantity !== undefined && (
                <View style={styles.quantityItem}>
                  <Text style={styles.quantityLabel}>Approved</Text>
                  <Text style={[styles.quantityValue, { color: Colors.success }]}>
                    {transfer.approvedQuantity} units
                  </Text>
                </View>
              )}
              {transfer.receivedQuantity !== undefined && (
                <View style={styles.quantityItem}>
                  <Text style={styles.quantityLabel}>Received</Text>
                  <Text style={[styles.quantityValue, { color: Colors.success }]}>
                    {transfer.receivedQuantity} units
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <TransferTimeline timeline={getTimeline()} />
        </View>

        {/* Carrier Info */}
        {(transfer.carrier || transfer.carrierName) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Carrier Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{transfer.carrier?.name || transfer.carrierName}</Text>
              </View>
              {(transfer.carrier?.phone || transfer.carrierPhone) && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color={Colors.primary} />
                  <Text style={styles.infoText}>{transfer.carrier?.phone || transfer.carrierPhone}</Text>
                </View>
              )}
              {(transfer.carrier?.vehicle || transfer.carrierVehicle) && (
                <View style={styles.infoRow}>
                  <Ionicons name="car" size={20} color={Colors.primary} />
                  <Text style={styles.infoText}>{transfer.carrier?.vehicle || transfer.carrierVehicle}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{transfer.reason}</Text>
          </View>
        </View>

        {/* Notes */}
        {transfer.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{transfer.notes}</Text>
            </View>
          </View>
        )}

        {/* Approval Notes */}
        {transfer.approvalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Approval Notes</Text>
            <View style={[styles.noteCard, { backgroundColor: Colors.successLight }]}>
              <Text style={styles.noteText}>{transfer.approvalNotes}</Text>
            </View>
          </View>
        )}

        {/* Receipt Notes */}
        {transfer.receiptNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Notes</Text>
            <View style={[styles.noteCard, { backgroundColor: Colors.lightBlue }]}>
              <Text style={styles.noteText}>{transfer.receiptNotes}</Text>
            </View>
          </View>
        )}

        {/* Rejection Reason */}
        {transfer.rejectionReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rejection Reason</Text>
            <View style={[styles.noteCard, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.noteText, { color: Colors.danger }]}>
                {transfer.rejectionReason}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {(showApproveButton || showRejectButton || showReadyButton || showDeliveryButton || showDeliveredButton || showReceiveButton || showCancelButton) && (
          <View style={styles.actionsSection}>
            {/* PENDING Status: Approve / Reject */}
            {showApproveButton && (
              <Button
                title="Approve"
                onPress={() => setShowApproveModal(true)}
                color={Colors.success}
                leftIcon={<Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
              />
            )}

            {showRejectButton && (
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => setShowRejectModal(true)}
              >
                <Ionicons name="close-circle" size={20} color={Colors.danger} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            )}

            {/* APPROVED Status: Mark as Ready */}
            {showReadyButton && (
              <Button
                title="Mark as Ready"
                onPress={() => setShowReadyModal(true)}
                color={Colors.primary}
                leftIcon={<Ionicons name="checkmark-done" size={20} color={Colors.white} />}
              />
            )}

            {/* READY Status: Start Delivery */}
            {showDeliveryButton && (
              <Button
                title="Start Delivery"
                onPress={() => setShowDeliveryModal(true)}
                color={Colors.warning}
                leftIcon={<Ionicons name="car" size={20} color={Colors.white} />}
              />
            )}

            {/* IN_TRANSIT Status: Mark Delivered */}
            {showDeliveredButton && (
              <Button
                title="Mark as Delivered"
                onPress={() => setShowDeliveredModal(true)}
                color={Colors.accent}
                leftIcon={<Ionicons name="checkmark-done-circle" size={20} color={Colors.white} />}
              />
            )}

            {/* DELIVERED Status: Confirm Receipt */}
            {showReceiveButton && (
              <Button
                title="Confirm Receipt"
                onPress={() => setShowReceiveModal(true)}
                color={Colors.success}
                leftIcon={<Ionicons name="checkmark-done" size={20} color={Colors.white} />}
              />
            )}

            {/* Cancel Button (for pending transfers by requester) */}
            {showCancelButton && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelTransfer}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color={Colors.danger} />
                    <Text style={styles.cancelButtonText}>Cancel Transfer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {showApproveModal && transfer && (
        <ApproveTransferModal
          visible={showApproveModal}
          transfer={transfer}
          onClose={() => setShowApproveModal(false)}
          onSuccess={handleApproveSuccess}
        />
      )}

      {showRejectModal && transfer && (
        <RejectTransferModal
          visible={showRejectModal}
          transfer={transfer}
          onClose={() => setShowRejectModal(false)}
          onSuccess={handleRejectSuccess}
        />
      )}

      {showReadyModal && transfer && (
        <MarkReadyModal
          visible={showReadyModal}
          transfer={transfer}
          onClose={() => setShowReadyModal(false)}
          onSuccess={handleReadySuccess}
        />
      )}

      {showDeliveryModal && transfer && (
        <StartDeliveryModal
          visible={showDeliveryModal}
          transfer={transfer}
          onClose={() => setShowDeliveryModal(false)}
          onSuccess={handleDeliverySuccess}
        />
      )}

      {showDeliveredModal && transfer && (
        <MarkDeliveredModal
          visible={showDeliveredModal}
          transfer={transfer}
          onClose={() => setShowDeliveredModal(false)}
          onSuccess={handleDeliveredSuccess}
        />
      )}

      {showReceiveModal && transfer && (
        <ReceiveTransferModal
          visible={showReceiveModal}
          transfer={transfer}
          onClose={() => setShowReceiveModal(false)}
          onSuccess={handleReceiveSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statusHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quantityItem: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsSection: {
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.white,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },
});
