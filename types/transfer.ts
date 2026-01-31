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
  
  // Product information (new backend structure)
  productId: string;
  productName?: string | null;
  productSku?: string | null;
  itemName?: string | null;    // Legacy field
  itemSku?: string | null;     // Legacy field
  
  // Location structures (for backward compatibility)
  fromLocation?: TransferLocation;
  toLocation?: TransferLocation;
  
  // Backend location fields
  fromLocationType?: LocationType;
  fromLocationId?: string;
  fromStoreId?: string | null;
  fromWarehouseId?: string | null;
  fromStore?: any | null;
  fromWarehouse?: any | null;
  
  toLocationType?: LocationType;
  toLocationId?: string;
  toStoreId?: string | null;
  toWarehouseId?: string | null;
  toStore?: any | null;
  toWarehouse?: any | null;
  
  // Item (for backward compatibility)
  item?: TransferItem;
  
  // Quantity
  requestedQuantity: number;
  approvedQuantity?: number;
  receivedQuantity?: number;
  damagedQuantity?: number | null;
  
  // Status and priority
  status: TransferStatus;
  priority: TransferPriority;
  
  // Users
  requestedBy?: {
    id: string;
    name: string;
    email?: string;
  };
  requestedByUserId?: string | null;
  requestedByName?: string | null;
  
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedByUserId?: string | null;
  approvedByName?: string | null;
  
  receivedByUser?: any | null;
  receivedByUserId?: string | null;
  receiverName?: string | null;
  
  // Carrier/Handler
  carrier?: CarrierInfo;
  carrierUserId?: string | null;
  carrierName?: string | null;
  carrierPhone?: string | null;
  carrierVehicle?: string | null;
  
  handlerUserId?: string | null;
  handlerName?: string | null;
  
  // Timeline (for backward compatibility)
  timeline?: TransferTimeline;
  
  // Timestamps (new backend structure)
  requestedAt?: string;
  approvedAt?: string | null;
  shippedAt?: string | null;
  receivedAt?: string | null;
  completedAt?: string | null;
  estimatedDeliveryAt?: string | null;
  
  // Additional info
  reason?: string;
  notes?: string;
  approvalNotes?: string;
  receiptNotes?: string;
  rejectionReason?: string;
  transportMethod?: string | null;
  conditionOnArrival?: string | null;
  
  // Other fields
  receiver?: ReceiverInfo;
  isReceiptConfirmed?: boolean;
  receiverSignatureUrl?: string | null;
  proofOfDeliveryUrl?: string | null;
  
  // Audit
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
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
  requests: TransferRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  success?: boolean;
  // For backward compatibility
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  hasMore?: boolean;
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
