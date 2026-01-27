import { apiClient } from './apiClient';

export interface Transfer {
  id: string;
  fromLocation: {
    type: 'STORE' | 'WAREHOUSE';
    id: string;
    name: string;
  };
  toLocation: {
    type: 'STORE' | 'WAREHOUSE';
    id: string;
    name: string;
  };
  item: {
    name: string;
    sku: string;
    productId: string;
  };
  requestedQuantity: number;
  approvedQuantity?: number;
  receivedQuantity?: number;
  status: TransferStatus;
  priority: TransferPriority;
  reason: string;
  notes?: string;
  requestedBy: {
    userId: string;
    username: string;
    email: string;
  };
  approvedBy?: {
    userId: string;
    username: string;
    email: string;
  };
  carrier?: {
    name: string;
    phone: string;
    vehicle?: string;
  };
  receiver?: {
    userId?: string;
    name: string;
  };
  timeline: {
    requestedAt: string;
    approvedAt?: string;
    shippedAt?: string;
    estimatedDeliveryAt?: string;
    receivedAt?: string;
  };
  receiptNotes?: string;
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PREPARING = 'PREPARING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RECEIVED = 'RECEIVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum TransferPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface CreateTransferRequest {
  fromLocationType: 'STORE' | 'WAREHOUSE';
  fromLocationId: string;
  toLocationType: 'STORE' | 'WAREHOUSE';
  toLocationId: string;
  itemName: string;
  itemSku: string;
  productId: string;
  requestedQuantity: number;
  priority: TransferPriority;
  reason: string;
  notes?: string;
}

export interface SendTransferRequest {
  approvedQuantity: number;
  carrierName: string;
  carrierPhone: string;
  carrierVehicle?: string;
  estimatedDeliveryAt: string;
  notes?: string;
}

export interface ReceiveTransferRequest {
  receivedQuantity: number;
  receiverName: string;
  receiptNotes?: string;
  damageReported: boolean;
}

export interface TransferFilters {
  status?: TransferStatus[];
  priority?: TransferPriority[];
  locationId?: string;
  locationType?: 'STORE' | 'WAREHOUSE';
  startDate?: string;
  endDate?: string;
  requestedBy?: string;
  search?: string;
}

/**
 * Transfer Request API Service
 * Handles all transfer request operations between stores and warehouses
 */
export const transferApi = {
  /**
   * Get all transfers with optional filters
   */
  getTransfers: async (filters?: TransferFilters, page = 0, size = 20) => {
    return apiClient.get<{ success: boolean; transfers: Transfer[]; pagination: any }>(
      '/api/transfers',
      { params: { ...filters, page, size } }
    );
  },

  /**
   * Get transfer by ID
   */
  getTransferById: async (id: string) => {
    return apiClient.get<Transfer>(`/api/transfers/${id}`);
  },

  /**
   * Create transfer request (any user)
   */
  createTransfer: async (request: CreateTransferRequest) => {
    return apiClient.post<Transfer>('/api/transfers/request', request);
  },

  /**
   * Send/Ship transfer (GM+ only)
   */
  sendTransfer: async (id: string, sendData: SendTransferRequest) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/send`, sendData);
  },

  /**
   * Approve transfer (GM+ only)
   */
  approveTransfer: async (id: string, approvedQuantity: number) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/approve`, { approvedQuantity });
  },

  /**
   * Reject transfer (GM+ only)
   */
  rejectTransfer: async (id: string, reason: string) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/reject`, { reason });
  },

  /**
   * Confirm receipt
   */
  receiveTransfer: async (id: string, receiptData: ReceiveTransferRequest) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/receive`, receiptData);
  },

  /**
   * Complete transfer
   */
  completeTransfer: async (id: string) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/complete`);
  },

  /**
   * Cancel transfer
   */
  cancelTransfer: async (id: string, reason: string) => {
    return apiClient.post<Transfer>(`/api/transfers/${id}/cancel`, { reason });
  },

  /**
   * Get transfer history
   */
  getTransferHistory: async (filters: TransferFilters) => {
    return apiClient.get<{ success: boolean; transfers: Transfer[] }>(
      '/api/transfers/history',
      { params: filters }
    );
  }
};
