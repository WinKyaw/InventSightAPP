import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { TransferRequest, TransferStatus, LocationType } from '../types/transfer';

/**
 * GM+ roles that can approve transfers
 * NOTE: This is FALLBACK ONLY until backend sends availableActions
 * Backend should be the source of truth for permissions
 */
const GM_PLUS_ROLES = [
  'OWNER',           // ← ADDED
  'FOUNDER',
  'CEO',
  'GENERAL_MANAGER',
  'STORE_MANAGER',
  'ADMIN',
];

/**
 * Hook for checking transfer request permissions
 * 
 * IMPORTANT: This hook is for FALLBACK only when backend doesn't send availableActions.
 * Prefer using transfer.availableActions from backend response.
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
   * FALLBACK: Use this only if backend doesn't send availableActions
   */
  const canApproveTransfer = (transfer: TransferRequest): boolean => {
    // Prefer backend response
    if (transfer.availableActions) {
      return transfer.availableActions.includes('approve');
    }
    
    // Fallback to frontend check
    console.warn('⚠️ Using frontend permission fallback for approve - backend should send availableActions');
    return isGMPlus && transfer.status === TransferStatus.PENDING;
  };

  /**
   * Check if user can reject a specific transfer
   * FALLBACK: Use this only if backend doesn't send availableActions
   */
  const canRejectTransfer = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('reject');
    }
    console.warn('⚠️ Using frontend permission fallback for reject - backend should send availableActions');
    return isGMPlus && transfer.status === TransferStatus.PENDING;
  };

  /**
   * Check if user can mark transfer as ready
   */
  const canMarkAsReady = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('markReady');
    }
    console.warn('⚠️ Using frontend permission fallback for markReady - backend should send availableActions');
    return isGMPlus && transfer.status === TransferStatus.APPROVED;
  };

  /**
   * Check if user can start delivery
   */
  const canStartDelivery = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('startDelivery');
    }
    console.warn('⚠️ Using frontend permission fallback for startDelivery - backend should send availableActions');
    return isGMPlus && transfer.status === TransferStatus.READY;
  };

  /**
   * Check if user can mark as delivered
   */
  const canMarkAsDelivered = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('markDelivered');
    }
    console.warn('⚠️ Using frontend permission fallback for markDelivered - backend should send availableActions');
    return isGMPlus && transfer.status === TransferStatus.IN_TRANSIT;
  };

  /**
   * Check if user can cancel their own transfer request
   */
  const canCancelTransfer = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('cancel');
    }
    
    console.warn('⚠️ Using frontend permission fallback for cancel - backend should send availableActions');
    if (!user) return false;
    
    const requestedById = transfer.requestedBy?.id || transfer.requestedByUserId;
    return (
      requestedById === user.id &&
      transfer.status === TransferStatus.PENDING
    );
  };

  /**
   * Check if user can receive a transfer at the destination
   */
  const canReceiveTransfer = (transfer: TransferRequest): boolean => {
    if (transfer.availableActions) {
      return transfer.availableActions.includes('receive');
    }
    
    console.warn('⚠️ Using frontend permission fallback for receive - backend should send availableActions');
    if (!user) return false;

    const receivableStatuses = [
      TransferStatus.DELIVERED,
    ];
    
    return receivableStatuses.includes(transfer.status);
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
    const requestedById = transfer.requestedBy?.id || transfer.requestedByUserId;
    if (requestedById === user.id) return true;

    // Check if user has access to either location involved
    const fromLocationId = transfer.fromLocation?.id || transfer.fromLocationId;
    const fromLocationType = transfer.fromLocation?.type || transfer.fromLocationType;
    const toLocationId = transfer.toLocation?.id || transfer.toLocationId;
    const toLocationType = transfer.toLocation?.type || transfer.toLocationType;
    
    const hasFromAccess = fromLocationId && fromLocationType 
      ? hasLocationAccess(fromLocationId, fromLocationType)
      : false;
    const hasToAccess = toLocationId && toLocationType
      ? hasLocationAccess(toLocationId, toLocationType)
      : false;

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
    canMarkAsReady,
    canStartDelivery,
    canMarkAsDelivered,
    canCancelTransfer,
    canReceiveTransfer,
    canCreateTransfer,
    canViewTransfer,
    hasLocationAccess,
    getAccessibleLocations,
  };
}
