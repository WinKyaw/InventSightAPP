import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TransferStatus } from '../../types/transfer';
import { Colors } from '../../constants/Colors';

interface TransferStatusBadgeProps {
  status: TransferStatus;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Status badge component for transfer requests
 * Shows color-coded status with icon
 */
export function TransferStatusBadge({ status, size = 'medium' }: TransferStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case TransferStatus.PENDING:
        return {
          label: 'Pending',
          color: '#3B82F6', // Blue
          backgroundColor: '#DBEAFE',
          icon: '🔵',
        };
      case TransferStatus.APPROVED:
        return {
          label: 'Approved',
          color: '#10B981', // Green
          backgroundColor: '#D1FAE5',
          icon: '🟢',
        };
      case TransferStatus.IN_TRANSIT:
        return {
          label: 'In Transit',
          color: '#F59E0B', // Yellow
          backgroundColor: '#FEF3C7',
          icon: '🟡',
        };
      case TransferStatus.DELIVERED:
        return {
          label: 'Delivered',
          color: '#F97316', // Orange
          backgroundColor: '#FFEDD5',
          icon: '🟠',
        };
      case TransferStatus.RECEIVED:
      case TransferStatus.COMPLETED:
        return {
          label: status === TransferStatus.RECEIVED ? 'Received' : 'Completed',
          color: '#059669', // Success green
          backgroundColor: '#D1FAE5',
          icon: '✅',
        };
      case TransferStatus.PARTIALLY_RECEIVED:
        return {
          label: 'Partial',
          color: '#8B5CF6', // Purple
          backgroundColor: '#EDE9FE',
          icon: '⚡',
        };
      case TransferStatus.REJECTED:
      case TransferStatus.CANCELLED:
        return {
          label: status === TransferStatus.REJECTED ? 'Rejected' : 'Cancelled',
          color: '#EF4444', // Red
          backgroundColor: '#FEE2E2',
          icon: '❌',
        };
      default:
        return {
          label: status,
          color: '#6B7280', // Gray
          backgroundColor: '#F3F4F6',
          icon: '⚪',
        };
    }
  };

  const config = getStatusConfig();
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
