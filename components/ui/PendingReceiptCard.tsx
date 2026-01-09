import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Receipt } from '../../types';

interface PendingReceiptCardProps {
  receipt: Receipt;
  onFulfill?: () => void;
  onDeliver?: () => void;
}

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const PendingReceiptCard: React.FC<PendingReceiptCardProps> = ({
  receipt,
  onFulfill,
  onDeliver,
}) => {
  return (
    <View style={styles.pendingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.receiptNumber}>#{receipt.receiptNumber}</Text>
        <View style={styles.badge}>
          {receipt.receiptType === 'DELIVERY' && (
            <View style={[styles.badgeContainer, styles.deliveryBadge]}>
              <Text style={styles.badgeText}>🚚 Delivery</Text>
            </View>
          )}
          {receipt.receiptType === 'PICKUP' && (
            <View style={[styles.badgeContainer, styles.pickupBadge]}>
              <Text style={styles.badgeText}>📦 Pickup</Text>
            </View>
          )}
          {receipt.receiptType === 'IN_STORE' && (
            <View style={[styles.badgeContainer, styles.inStoreBadge]}>
              <Text style={styles.badgeText}>🏪 In-Store</Text>
            </View>
          )}
        </View>
      </View>
      
      <Text style={styles.customer}>
        👤 {receipt.customerName || 'Walk-in Customer'}
      </Text>
      
      <Text style={styles.amount}>
        ${(receipt.totalAmount || receipt.total || 0).toFixed(2)}
      </Text>
      
      <Text style={styles.createdAt}>
        Created {formatRelativeTime(receipt.createdAt)} by {receipt.processedByFullName || receipt.processedByUsername || 'Unknown'}
      </Text>
      
      {receipt.deliveryPersonName && (
        <Text style={styles.deliveryInfo}>
          🚚 Assigned to: {receipt.deliveryPersonName}
        </Text>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        {!receipt.fulfilledAt && onFulfill && (
          <TouchableOpacity 
            style={styles.fulfillButton}
            onPress={onFulfill}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
            <Text style={styles.fulfillButtonText}>Mark as Fulfilled</Text>
          </TouchableOpacity>
        )}
        
        {receipt.receiptType === 'DELIVERY' && receipt.fulfilledAt && !receipt.deliveredAt && onDeliver && (
          <TouchableOpacity 
            style={styles.deliverButton}
            onPress={onDeliver}
          >
            <Ionicons name="car-outline" size={16} color="#3B82F6" />
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pendingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    flexDirection: 'row',
  },
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  deliveryBadge: {
    backgroundColor: '#DBEAFE',
  },
  pickupBadge: {
    backgroundColor: '#FEF3C7',
  },
  inStoreBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customer: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  createdAt: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  deliveryInfo: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 4,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  fulfillButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  fulfillButtonText: {
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  deliverButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  deliverButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
});
