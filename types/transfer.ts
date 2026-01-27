// Transfer Request Types and Interfaces

/**
 * Transfer request status enum
 */
export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RECEIVED = 'RECEIVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

/**
 * Transfer request priority enum
 */
export enum TransferPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Location type enum
 */
export enum LocationType {
  STORE = 'STORE',
  WAREHOUSE = 'WAREHOUSE'
}

/**
 * Location interface for transfer requests
 */
export interface TransferLocation {
  type: LocationType;
  id: string;
  name: string;
  address?: string;
}

/**
 * Item information in transfer request
 */
export interface TransferItem {
  name: string;
  sku: string;
  productId: string;
  imageUrl?: string;
}

/**
 * Carrier information
 */
export interface CarrierInfo {
  name: string;
  phone?: string;
  vehicle?: string;
}

/**
 * Receiver information
 */
export interface ReceiverInfo {
  userId?: string;
  name: string;
}

/**
 * Transfer timeline tracking
 */
export interface TransferTimeline {
  requestedAt: string;
  requestedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  shippedAt?: string;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  receivedAt?: string;
  receivedBy?: {
    id: string;
    name: string;
  };
}

/**
 * Main transfer request interface
 */
export interface TransferRequest {
  id: string;
  fromLocation: TransferLocation;
  toLocation: TransferLocation;
  item: TransferItem;
  requestedQuantity: number;
  approvedQuantity?: number;
  receivedQuantity?: number;
  status: TransferStatus;
  priority: TransferPriority;
  reason: string;
  notes?: string;
  requestedBy: {
    id: string;
    name: string;
    email?: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
  carrier?: CarrierInfo;
  receiver?: ReceiverInfo;
  timeline: TransferTimeline;
  approvalNotes?: string;
  receiptNotes?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO for creating a new transfer request
 */
export interface CreateTransferRequestDTO {
  fromLocationId: string;
  fromLocationType: LocationType;
  toLocationId: string;
  toLocationType: LocationType;
  productId: string;
  requestedQuantity: number;
  priority: TransferPriority;
  reason: string;
  notes?: string;
}

/**
 * DTO for sending/approving a transfer
 */
export interface SendTransferDTO {
  approvedQuantity: number;
  carrierName: string;
  carrierPhone?: string;
  carrierVehicle?: string;
  estimatedDeliveryAt?: string;
  approvalNotes?: string;
}

/**
 * DTO for confirming receipt
 */
export interface ReceiptDTO {
  receivedQuantity: number;
  receiverName: string;
  receivedAt?: string;
  condition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  receiptNotes?: string;
  damageNotes?: string;
  missingItemsNotes?: string;
}

/**
 * Filters for transfer request list
 */
export interface TransferFilters {
  status?: TransferStatus | 'ALL';
  locationId?: string;
  locationType?: LocationType;
  fromDate?: string;
  toDate?: string;
  searchQuery?: string; // Search by item name or transfer ID
  priority?: TransferPriority;
  myLocationsOnly?: boolean;
}

/**
 * Paginated response for transfer requests
 */
export interface PaginatedTransferResponse {
  items: TransferRequest[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

/**
 * Transfer history summary statistics
 */
export interface TransferHistorySummary {
  totalTransfers: number;
  pendingCount: number;
  completedCount: number;
  inTransitCount: number;
  avgDeliveryTime: number; // in hours
  topRequestedItems: Array<{
    itemName: string;
    sku: string;
    count: number;
  }>;
  mostActiveRoutes: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}
