import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransferRequest, TransferPriority } from '../../types/transfer';
import { TransferStatusBadge } from './TransferStatusBadge';
import { Colors } from '../../constants/Colors';

interface TransferRequestCardProps {
  transfer: TransferRequest;
  onPress: (transfer: TransferRequest) => void;
  onActionPress?: (transfer: TransferRequest, action: string) => void;
  showActions?: boolean;
}

/**
 * Card component for displaying transfer request in list
 */
export function TransferRequestCard({
  transfer,
  onPress,
  onActionPress,
  showActions = false,
}: TransferRequestCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: TransferPriority) => {
    switch (priority) {
      case TransferPriority.HIGH:
        return '#EF4444';
      case TransferPriority.MEDIUM:
        return '#F59E0B';
      case TransferPriority.LOW:
        return '#10B981';
      default:
        return Colors.gray;
    }
  };

  const getLocationIcon = (type: string) => {
    return type === 'WAREHOUSE' ? 'business' : 'storefront';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(transfer)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <TransferStatusBadge status={transfer.status} size="small" />
        <View style={styles.headerRight}>
          <Text style={styles.transferId}>#{transfer.id}</Text>
          {transfer.priority === TransferPriority.HIGH && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(transfer.priority) }]}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          )}
        </View>
      </View>

      {/* Item */}
      <View style={styles.itemSection}>
        <Ionicons name="cube" size={20} color={Colors.primary} />
        <Text style={styles.itemName}>
          {transfer.item.name} ({transfer.requestedQuantity} units)
        </Text>
      </View>

      {/* Locations */}
      <View style={styles.locationSection}>
        <View style={styles.location}>
          <Ionicons
            name={getLocationIcon(transfer.fromLocation.type) as any}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.locationText}>{transfer.fromLocation.name}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={Colors.gray} style={styles.arrow} />
        <View style={styles.location}>
          <Ionicons
            name={getLocationIcon(transfer.toLocation.type) as any}
            size={16}
            color={Colors.success}
          />
          <Text style={styles.locationText}>{transfer.toLocation.name}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.detail}>
          Requested: {formatDate(transfer.timeline.requestedAt)} by {transfer.requestedBy.name}
        </Text>
        {transfer.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            Reason: {transfer.reason}
          </Text>
        )}
      </View>

      {/* Carrier Info (if in transit) */}
      {transfer.carrier && (
        <View style={styles.carrierSection}>
          <Ionicons name="car" size={16} color={Colors.warning} />
          <Text style={styles.carrierText}>
            Carrier: {transfer.carrier.name}
            {transfer.carrier.vehicle && ` (${transfer.carrier.vehicle})`}
          </Text>
        </View>
      )}

      {/* Actions */}
      {showActions && onActionPress && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onActionPress(transfer, 'view')}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transferId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginRight: 8,
  },
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  itemSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginLeft: 8,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
  },
  arrow: {
    marginHorizontal: 8,
  },
  detailsSection: {
    marginBottom: 8,
  },
  detail: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  carrierSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginTop: 8,
  },
  carrierText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 6,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
