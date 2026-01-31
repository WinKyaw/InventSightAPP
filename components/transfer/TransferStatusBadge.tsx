import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransferStatus } from '../../types/transfer';
import { Colors } from '../../constants/Colors';

interface TransferStatusBadgeProps {
  status: TransferStatus | string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Status badge component for transfer requests
 * Shows color-coded status with icon
 */
export function TransferStatusBadge({ status, size = 'medium' }: TransferStatusBadgeProps) {
  const getStatusConfig = () => {
    // ✅ Handle null/undefined status
    if (!status) {
      return {
        label: 'Unknown',
        color: '#6B7280', // Gray
        backgroundColor: '#F3F4F6',
        icon: '⚪',
      };
    }

    // ✅ Normalize status to uppercase
    const normalizedStatus = status.toString().toUpperCase();

    switch (normalizedStatus) {
      case 'PENDING':
        return {
          label: 'Pending',
          color: '#3B82F6', // Blue
          backgroundColor: '#DBEAFE',
          icon: '🔵',
        };
      case 'APPROVED':
        return {
          label: 'Approved',
          color: '#10B981', // Green
          backgroundColor: '#D1FAE5',
          icon: '🟢',
        };
      case 'IN_TRANSIT':
      case 'INTRANSIT':
        return {
          label: 'In Transit',
          color: '#F59E0B', // Yellow
          backgroundColor: '#FEF3C7',
          icon: '🟡',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          color: '#F97316', // Orange
          backgroundColor: '#FFEDD5',
          icon: '🟠',
        };
      case 'RECEIVED':
      case 'COMPLETED':
        return {
          label: normalizedStatus === 'RECEIVED' ? 'Received' : 'Completed',
          color: '#059669', // Success green
          backgroundColor: '#D1FAE5',
          icon: '✅',
        };
      case 'PARTIALLY_RECEIVED':
        return {
          label: 'Partial',
          color: '#8B5CF6', // Purple
          backgroundColor: '#EDE9FE',
          icon: '⚡',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          color: '#EF4444', // Red
          backgroundColor: '#FEE2E2',
          icon: '❌',
        };
      case 'CANCELLED':
      case 'CANCELED':
        return {
          label: 'Cancelled',
          color: '#EF4444', // Red
          backgroundColor: '#FEE2E2',
          icon: '❌',
        };
      default:
        // ✅ Default case for unknown statuses
        console.warn(`Unknown transfer status: ${status}`);
        return {
          label: status.toString().charAt(0).toUpperCase() + status.toString().slice(1).toLowerCase(),
          color: '#6B7280', // Gray
          backgroundColor: '#F3F4F6',
          icon: '⚪',
        };
    }
  };

  const config = getStatusConfig();
  
  // ✅ Safety check
  if (!config || !config.label) {
    return null;
  }

  const sizeStyles = getSizeStyles(size);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        sizeStyles.container,
      ]}
    >
      {size !== 'small' && (
        <Text style={[styles.icon, sizeStyles.icon]}>{config.icon}</Text>
      )}
      <Text
        style={[
          styles.label,
          { color: config.color },
          sizeStyles.text,
        ]}
      >
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        container: { paddingVertical: 2, paddingHorizontal: 6 },
        icon: { fontSize: 8 },
        text: { fontSize: 10 },
      };
    case 'large':
      return {
        container: { paddingVertical: 8, paddingHorizontal: 16 },
        icon: { fontSize: 16 },
        text: { fontSize: 16, fontWeight: '700' as const },
      };
    default: // medium
      return {
        container: { paddingVertical: 4, paddingHorizontal: 10 },
        icon: { fontSize: 12 },
        text: { fontSize: 12, fontWeight: '600' as const },
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
