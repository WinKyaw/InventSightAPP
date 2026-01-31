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
 * Get product name from transfer request
 * Handles multiple field names and null values
 */
const getProductName = (transfer: TransferRequest): string => {
  return transfer.productName || transfer.itemName || transfer.item?.name || 'Unknown Product';
};

/**
 * Get product SKU from transfer request
 * Handles multiple field names and null values
 */
const getProductSku = (transfer: TransferRequest): string => {
  return transfer.productSku || transfer.itemSku || transfer.item?.sku || 'N/A';
};

/**
 * Get "FROM" location name
 * Handles both Store and Warehouse with multiple field names
 */
const getFromLocationName = (transfer: TransferRequest): string => {
  console.log('🔍 Getting FROM location name:', {
    type: transfer.fromLocationType,
    warehouse: transfer.fromWarehouse,
    store: transfer.fromStore,
  });

  // Try warehouse first
  if (transfer.fromLocationType === 'WAREHOUSE' || transfer.fromWarehouse) {
    const warehouse = transfer.fromWarehouse;
    if (warehouse) {
      return warehouse.name || 
             warehouse.warehouseName || 
             'Unknown Warehouse';
    }
  }
  
  // Try store
  if (transfer.fromLocationType === 'STORE' || transfer.fromStore) {
    const store = transfer.fromStore;
    if (store) {
      return store.storeName || 
             store.name || 
             store.storeCode ||
             'Unknown Store';
    }
  }
  
  // Try legacy location field
  if (transfer.fromLocation?.name) {
    return transfer.fromLocation.name;
  }
  
  return 'Unknown Location';
};

/**
 * Get "TO" location name
 * Handles both Store and Warehouse with multiple field names
 */
const getToLocationName = (transfer: TransferRequest): string => {
  console.log('🔍 Getting TO location name:', {
    type: transfer.toLocationType,
    warehouse: transfer.toWarehouse,
    store: transfer.toStore,
  });

  // Try warehouse first
  if (transfer.toLocationType === 'WAREHOUSE' || transfer.toWarehouse) {
    const warehouse = transfer.toWarehouse;
    if (warehouse) {
      return warehouse.name || 
             warehouse.warehouseName || 
             'Unknown Warehouse';
    }
  }
  
  // Try store
  if (transfer.toLocationType === 'STORE' || transfer.toStore) {
    const store = transfer.toStore;
    if (store) {
      return store.storeName || 
             store.name || 
             store.storeCode ||
             'Unknown Store';
    }
  }
  
  // Try legacy location field
  if (transfer.toLocation?.name) {
    return transfer.toLocation.name;
  }
  
  return 'Unknown Location';
};

/**
 * Get requester name from nested User object
 */
const getRequesterName = (transfer: TransferRequest): string => {
  // Try requestedByName first (flat field)
  if (transfer.requestedByName) {
    return transfer.requestedByName;
  }
  
  // Try to build from requestedBy object
  if (transfer.requestedBy) {
    const user = transfer.requestedBy;
    // Try to build full name
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    // Fall back to username
    if (user.username) {
      return user.username;
    }
    // Fall back to name field if present
    if (user.name) {
      return user.name;
    }
  }
  
  // Try legacy timeline field
  if (transfer.timeline?.requestedBy?.name) {
    return transfer.timeline.requestedBy.name;
  }
  
  return 'Unknown';
};

/**
 * Card component for displaying transfer request in list
 */
export function TransferRequestCard({
  transfer,
  onPress,
  onActionPress,
  showActions = false,
}: TransferRequestCardProps) {
  try {
    // ✅ Debug logging
    console.log('📦 Transfer card data:', {
      id: transfer.id.substring(0, 8),
      fromStore: transfer.fromStore,
      fromWarehouse: transfer.fromWarehouse,
      toStore: transfer.toStore,
      toWarehouse: transfer.toWarehouse,
    });

    const productName = getProductName(transfer);
    const productSku = getProductSku(transfer);
    const fromLocationName = getFromLocationName(transfer);
    const toLocationName = getToLocationName(transfer);
  const requesterName = getRequesterName(transfer);
  
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

  const getLocationIcon = (type?: string) => {
    return type === 'WAREHOUSE' ? 'business' : 'storefront';
  };
  
  // Location types
  const fromLocationType = transfer.fromLocation?.type || transfer.fromLocationType;
  const toLocationType = transfer.toLocation?.type || transfer.toLocationType;
  
  // Timestamp
  const requestedAt = transfer.timeline?.requestedAt || transfer.requestedAt || '';

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
          {productName} ({transfer.requestedQuantity} units)
        </Text>
      </View>

      {/* Locations */}
      <View style={styles.locationSection}>
        <View style={styles.location}>
          <Ionicons
            name={getLocationIcon(fromLocationType) as any}
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.locationText}>{fromLocationName}</Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={Colors.gray} style={styles.arrow} />
        <View style={styles.location}>
          <Ionicons
            name={getLocationIcon(toLocationType) as any}
            size={16}
            color={Colors.success}
          />
          <Text style={styles.locationText}>{toLocationName}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.detail}>
          Requested: {formatDate(requestedAt)} by {requesterName}
        </Text>
        {transfer.reason && (
          <Text style={styles.reason} numberOfLines={2}>
            Reason: {transfer.reason}
          </Text>
        )}
      </View>

      {/* Carrier Info (if in transit) */}
      {(transfer.carrier || transfer.carrierName) && (
        <View style={styles.carrierSection}>
          <Ionicons name="car" size={16} color={Colors.warning} />
          <Text style={styles.carrierText}>
            Carrier: {transfer.carrier?.name || transfer.carrierName}
            {(transfer.carrier?.vehicle || transfer.carrierVehicle) && ` (${transfer.carrier?.vehicle || transfer.carrierVehicle})`}
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
  } catch (error) {
    console.error('❌ Error rendering transfer card:', error);
    console.error('Transfer data:', transfer);
    
    // ✅ Fallback UI if card fails to render
    return (
      <View style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
        <Text style={{ color: '#DC3545', fontWeight: '600' }}>
          Error displaying transfer
        </Text>
        <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
          ID: {transfer.id ? transfer.id.substring(0, 8) : 'Unknown'}
        </Text>
      </View>
    );
  }
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
    color: Colors.textSecondary,
    marginRight: 8,
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
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    color: Colors.textSecondary,
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
