// Transfer Request Types and Interfaces

/**
 * Store interface for nested store objects
 */
export interface Store {
  id: string;
  storeName: string;
  name?: string;
  storeCode?: string;
  address?: string;
}

/**
 * Warehouse interface for nested warehouse objects
 */
export interface Warehouse {
  id: string;
  name: string;
  warehouseName?: string;
  address?: string;
  capacity?: number;
}

/**
 * User interface for nested user objects
 */
export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

/**
 * Company interface for nested company objects
 */
export interface Company {
  id: string;
  name: string;
  companyCode?: string;
}

/**
 * Transfer request status enum
 */
export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  READY = 'READY',
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
  
  // Backend location fields with properly typed nested objects
  fromLocationType?: LocationType;
  fromLocationId?: string;
  fromStoreId?: string | null;
  fromWarehouseId?: string | null;
  fromStore?: Store | null;        // ✅ Properly typed nested object
  fromWarehouse?: Warehouse | null; // ✅ Properly typed nested object
  
  toLocationType?: LocationType;
  toLocationId?: string;
  toStoreId?: string | null;
  toWarehouseId?: string | null;
  toStore?: Store | null;          // ✅ Properly typed nested object
  toWarehouse?: Warehouse | null;  // ✅ Properly typed nested object
  
  // Company (nested object)
  companyId?: string | null;
  fromCompanyId?: string | null;
  toCompanyId?: string | null;
  company?: Company | null;        // ✅ Properly typed nested object
  
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
  
  // Users with properly typed nested objects
  requestedBy?: User | null;       // ✅ Properly typed nested object
  requestedByUserId?: string | null;
  requestedByName?: string | null;
  
  approvedBy?: User | null;        // ✅ Properly typed nested object
  approvedByUserId?: string | null;
  approvedByName?: string | null;
  
  receivedByUser?: User | null;    // ✅ Properly typed nested object
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
