import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRequest, TransferStatus, LocationType } from '../types/transfer';

/**
 * GM+ roles that can approve transfers
 */
const GM_PLUS_ROLES = [
  'FOUNDER',
  'CEO',
  'GENERAL_MANAGER',
  'STORE_MANAGER',
  'ADMIN',
];

/**
 * Hook for checking transfer request permissions
 */
export function useTransferPermissions() {
  const { user } = useAuth();

  /**
   * Check if user has GM+ role (can approve transfers)
   */
  const isGMPlus = useMemo(() => {
    if (!user || !user.role) return false;
    return GM_PLUS_ROLES.includes(user.role.toUpperCase());
  }, [user]);

  /**
   * Check if user can approve a specific transfer
   */
  const canApproveTransfer = (transfer: TransferRequest): boolean => {
    return isGMPlus && transfer.status === TransferStatus.PENDING;
  };

  /**
   * Check if user can reject a specific transfer
   */
  const canRejectTransfer = (transfer: TransferRequest): boolean => {
    return isGMPlus && transfer.status === TransferStatus.PENDING;
  };

  /**
   * Check if user can cancel their own transfer request
   */
  const canCancelTransfer = (transfer: TransferRequest): boolean => {
    if (!user) return false;
    
    // Can cancel if it's their own request and it's still pending
    return (
      transfer.requestedBy.id === user.id &&
      transfer.status === TransferStatus.PENDING
    );
  };

  /**
   * Check if user can receive a transfer at the destination
   * User must have access to the destination location
   */
  const canReceiveTransfer = (transfer: TransferRequest): boolean => {
    if (!user) return false;

    // Check if transfer is in a receivable status
    const receivableStatuses = [
      TransferStatus.IN_TRANSIT,
      TransferStatus.DELIVERED,
    ];
    
    if (!receivableStatuses.includes(transfer.status)) {
      return false;
    }

    // TODO: Check if user has access to destination location
    // This would require location assignment data from the backend
    // For now, we'll allow any authenticated user to receive
    // In production, you'd check against user's assigned locations
    
    return true;
  };

  /**
   * Check if user has access to a specific location
   * @param locationId - Location ID
   * @param locationType - Location type (STORE or WAREHOUSE)
   */
  const hasLocationAccess = (
    locationId: string,
    locationType: LocationType
  ): boolean => {
    if (!user) return false;

    // GM+ users have access to all locations
    if (isGMPlus) return true;

    // Check if user has access to this specific location
    // TODO: Implement based on backend location assignment API
    // For now, check if it matches user's active store/warehouse
    if (locationType === LocationType.STORE) {
      return (
        user.activeStoreId === locationId ||
        user.currentStoreId === locationId
      );
    } else if (locationType === LocationType.WAREHOUSE) {
      return user.currentWarehouseId === locationId;
    }

    return false;
  };

  /**
   * Check if user can create transfer requests
   * Any authenticated user can create transfer requests
   */
  const canCreateTransfer = (): boolean => {
    return !!user;
  };

  /**
   * Check if user can view a specific transfer
   * Users can view transfers that involve their locations
   */
  const canViewTransfer = (transfer: TransferRequest): boolean => {
    if (!user) return false;

    // GM+ can view all transfers
    if (isGMPlus) return true;

    // Check if user is the requester
    if (transfer.requestedBy.id === user.id) return true;

    // Check if user has access to either location involved
    const hasFromAccess = hasLocationAccess(
      transfer.fromLocation.id,
      transfer.fromLocation.type
    );
    const hasToAccess = hasLocationAccess(
      transfer.toLocation.id,
      transfer.toLocation.type
    );

    return hasFromAccess || hasToAccess;
  };

  /**
   * Get user's accessible locations for transfer requests
   * Returns array of location IDs the user has access to
   */
  const getAccessibleLocations = (): string[] => {
    if (!user) return [];

    const locations: string[] = [];

    // Add user's active/current locations
    if (user.activeStoreId) locations.push(user.activeStoreId);
    if (user.currentStoreId) locations.push(user.currentStoreId);
    if (user.currentWarehouseId) locations.push(user.currentWarehouseId);

    // GM+ users have access to all locations (indicated by empty filter)
    if (isGMPlus) return [];

    // Remove duplicates
    return [...new Set(locations)];
  };

  return {
    isGMPlus,
    canApproveTransfer,
    canRejectTransfer,
    canCancelTransfer,
    canReceiveTransfer,
    canCreateTransfer,
    canViewTransfer,
    hasLocationAccess,
    getAccessibleLocations,
  };
}
