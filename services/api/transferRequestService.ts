import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './config';
import {
  TransferRequest,
  CreateTransferRequestDTO,
  SendTransferDTO,
  ReceiptDTO,
  TransferFilters,
  PaginatedTransferResponse,
  TransferHistorySummary,
} from '../../types/transfer';

/**
 * Transfer Request API Service
 * Handles all transfer request operations
 */

/**
 * Helper function to unwrap API response
 * Handles multiple backend response structures:
 * 1. New structure: {availableActions: [...], transfer: {...}}
 * 2. Old structure: {success: true, request: {...}}
 * 3. Direct transfer object
 */
const unwrapTransferResponse = (response: any): TransferRequest => {
  let transferData;
  
  // New structure: {availableActions: [...], transfer: {...}}
  if (response.transfer && typeof response.transfer === 'object') {
    transferData = {
      ...response.transfer,
      availableActions: response.availableActions || [],
    };
  }
  // Old structure: {success: true, request: {...}}
  else if (response.request) {
    transferData = response.request;
  }
  // Direct transfer object
  else {
    transferData = response;
  }
  
  // Validate that we got a transfer object with an ID
  if (!transferData || !transferData.id) {
    console.error('⚠️ Invalid transfer response:', response);
    throw new Error('Invalid transfer response: missing transfer data');
  }
  
  return transferData;
};

/**
 * Create a new transfer request
 * @param request - Transfer request data
 * @returns Created transfer request
 */
export const createTransferRequest = async (
  request: CreateTransferRequestDTO
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.CREATE,
      request
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error('❌ Error creating transfer request:', error);
    throw error;
  }
};

/**
 * Get all transfer requests with optional filters and pagination
 * @param filters - Filter criteria
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 20)
 * @returns Paginated transfer requests
 */
export const getTransferRequests = async (
  filters?: TransferFilters,
  page: number = 0,
  size: number = 20
): Promise<PaginatedTransferResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());

    // Add filters to params
    if (filters?.status && filters.status !== 'ALL') {
      params.append('status', filters.status);
    }
    if (filters?.priority) {
      params.append('priority', filters.priority);
    }
    if (filters?.locationId) {
      params.append('locationId', filters.locationId);
    }
    if (filters?.locationType) {
      params.append('locationType', filters.locationType);
    }
    if (filters?.searchQuery) {
      params.append('searchQuery', filters.searchQuery);
    }
    if (filters?.fromDate) {
      params.append('fromDate', filters.fromDate);
    }
    if (filters?.toDate) {
      params.append('toDate', filters.toDate);
    }
    if (filters?.myLocationsOnly !== undefined) {
      params.append('myLocationsOnly', filters.myLocationsOnly.toString());
    }

    const url = `${API_ENDPOINTS.TRANSFER_REQUESTS.ALL}?${params.toString()}`;
    
    console.log('🌐 [API] Fetching transfers from:', url);
    
    const response = await apiClient.get<any>(url);
    
    console.log('✅ [API] Raw response:', response);
    console.log('📦 [API] Response type:', typeof response);
    console.log('📋 [API] Response keys:', Object.keys(response));
    
    // Handle different response structures from backend
    let rawRequests: any[] = [];
    let paginationData: any = {};
    
    if (Array.isArray(response)) {
      // Backend returned array directly
      console.log('📦 [API] Backend returned array directly');
      rawRequests = response;
      paginationData = {
        currentPage: page,
        totalPages: 1,
        totalElements: response.length,
        pageSize: size,
        hasNext: false,
        hasPrevious: false,
      };
    } else if (response.pagination && response.requests) {
      // Backend returned new structure with nested pagination
      console.log('📦 [API] Backend returned paginated response with nested pagination');
      rawRequests = response.requests;
      paginationData = response.pagination;
    } else if (response.requests) {
      // Backend returned old paginated response structure
      console.log('📦 [API] Backend returned old paginated response structure');
      rawRequests = response.requests;
      paginationData = {
        currentPage: response.currentPage ?? page,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalItems ?? response.requests.length,
        pageSize: size,
        hasNext: response.hasMore ?? false,
        hasPrevious: page > 0,
      };
    } else if ('data' in response && Array.isArray(response.data)) {
      // Backend returned { data: [...] }
      console.log('📦 [API] Backend returned data wrapper');
      rawRequests = response.data;
      paginationData = {
        currentPage: response.currentPage ?? page,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalItems ?? response.data.length,
        pageSize: size,
        hasNext: response.hasMore ?? false,
        hasPrevious: page > 0,
      };
    } else {
      console.warn('⚠️ [API] Unexpected response format:', response);
      rawRequests = [];
      paginationData = {
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        pageSize: size,
        hasNext: false,
        hasPrevious: false,
      };
    }
    
    // Unwrap each transfer item to handle nested structures
    const unwrappedRequests = rawRequests.map(unwrapTransferResponse);
    
    console.log('✅ [API] Unwrapped transfers:', unwrappedRequests.length);
    if (unwrappedRequests.length > 0) {
      console.log('📄 [API] First transfer:', unwrappedRequests[0]);
    }
    
    return {
      requests: unwrappedRequests,
      pagination: paginationData,
    };
  } catch (error) {
    console.error('❌ [API] Error fetching transfer requests:', error);
    throw error;
  }
};

/**
 * Get a single transfer request by ID
 * @param id - Transfer request ID
 * @returns Transfer request details
 */
export const getTransferRequestById = async (
  id: string
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.BY_ID(id)
    );
    
    // Unwrap the response to handle different structures
    const transferData = unwrapTransferResponse(response);
    
    // Debug logging (only in development)
    if (__DEV__) {
      console.log('📦 Transfer API response:', {
        hasRequest: !!response.request,
        hasTransfer: !!response.transfer,
        hasSuccess: !!response.success,
        transferId: transferData?.id,
        status: transferData?.status,
        fromWarehouse: transferData?.fromWarehouse,
        toStore: transferData?.toStore,
        availableActions: transferData?.availableActions,
      });
    }
    
    return transferData;
  } catch (error) {
    console.error(`❌ Error fetching transfer request ${id}:`, error);
    throw error;
  }
};

/**
 * Approve transfer request
 * Sets status to APPROVED (not IN_TRANSIT)
 */
export const approveTransfer = async (
  id: string,
  approvedQuantity: number,
  notes?: string
): Promise<TransferRequest> => {
  try {
    console.log('📤 Approving transfer:', { id, approvedQuantity, notes });
    
    // Ensure approvedQuantity is a number and not null/undefined
    const requestBody = {
      approvedQuantity: Number(approvedQuantity), // Force number type
      notes: notes || null,
    };
    
    console.log('📦 Request body:', JSON.stringify(requestBody));
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.APPROVE(id),
      requestBody
    );
    
    console.log('✅ Transfer approved - Full response:', JSON.stringify(response));
    
    // Handle different response structures
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    } else if (response) {
      return unwrapTransferResponse(response);
    }
    
    throw new Error('Invalid response structure from backend');
    
  } catch (error: any) {
    console.error('❌ Error approving transfer:', error);
    console.error('❌ Error response:', JSON.stringify(error.response));
    
    // Extract validation errors
    if (error.response?.status === 400 && error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      const errorMessages = Object.entries(validationErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    
    // Extract general error message
    const errorMessage = error.response?.data?.message || 'Failed to approve transfer';
    throw new Error(errorMessage);
  }
};

/**
 * DEPRECATED: Old approve and send function
 * Use approveTransfer() instead
 * @param id - Transfer request ID
 * @param sendData - Carrier and delivery information
 * @returns Updated transfer request
 */
export const approveAndSendTransfer = async (
  id: string,
  sendData: SendTransferDTO
): Promise<TransferRequest> => {
  console.warn('⚠️ approveAndSendTransfer is deprecated, use approveTransfer instead');
  return approveTransfer(id, sendData.approvedQuantity, sendData.approvalNotes);
};

/**
 * Reject a transfer request (GM+ only)
 * @param id - Transfer request ID
 * @param reason - Rejection reason
 * @returns Updated transfer request
 */
export const rejectTransfer = async (
  id: string,
  reason: string
): Promise<TransferRequest> => {
  try {
    console.log('📤 Rejecting transfer:', { id, reason });
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.REJECT(id),
      { reason }
    );
    
    console.log('✅ Transfer rejected:', JSON.stringify(response));
    
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    }
    
    return unwrapTransferResponse(response);
    
  } catch (error: any) {
    console.error('❌ Error rejecting transfer:', error);
    const errorMessage = error.response?.data?.message || 'Failed to reject transfer';
    throw new Error(errorMessage);
  }
};

/**
 * Confirm receipt of a transfer
 * @param id - Transfer request ID
 * @param receiptData - Receipt information matching backend ReceiveTransferDTO
 * @returns Updated transfer request
 */
export const confirmReceipt = async (
  id: string,
  receiptData: ReceiptDTO
): Promise<TransferRequest> => {
  try {
    // ✅ Build payload with proper null/default values (no undefined!)
    const payload = {
      receivedQuantity: Number(receiptData.receivedQuantity),           // ✅ Required field first
      receiptNotes: receiptData.receiptNotes || null,                   // ✅ null for optional string
      damageReported: (receiptData.damagedQuantity != null && receiptData.damagedQuantity > 0) || false,  // ✅ Boolean
      damagedQuantity: receiptData.damagedQuantity || 0,                // ✅ Number default
      receiverName: receiptData.receiverName || null,                   // ✅ null is valid JSON
      receiverSignatureUrl: receiptData.receiverSignatureUrl || null,   // ✅ null is valid
      deliveryQRCode: receiptData.deliveryQRCode || null                // ✅ null is valid
    };

    console.log('📤 Confirming receipt:', payload);
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.CONFIRM_RECEIPT(id),
      payload
    );
    
    console.log('✅ Receipt confirmed successfully:', response.data);
    
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    }
    
    return unwrapTransferResponse(response);
    
  } catch (error: any) {
    console.error('❌ Error confirming receipt:', error);
    const errorMessage = error.response?.data?.message || 'Failed to confirm receipt';
    throw new Error(errorMessage);
  }
};

/**
 * Cancel a transfer request
 * @param id - Transfer request ID
 * @param reason - Cancellation reason
 * @returns Updated transfer request
 */
export const cancelTransfer = async (
  id: string,
  reason: string
): Promise<TransferRequest> => {
  try {
    console.log('📤 Cancelling transfer:', { id, reason });
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.CANCEL(id),
      { reason: reason || null }
    );
    
    console.log('✅ Transfer cancelled:', JSON.stringify(response));
    
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    }
    
    return unwrapTransferResponse(response);
    
  } catch (error: any) {
    console.error('❌ Error cancelling transfer:', error);
    const errorMessage = error.response?.data?.message || 'Failed to cancel transfer';
    throw new Error(errorMessage);
  }
};

/**
 * Mark transfer as ready for pickup
 * @param id - Transfer request ID
 * @param data - Ready data (packer info, notes)
 * @returns Updated transfer request
 */
export const markAsReady = async (
  id: string,
  data: { packedBy: string; notes?: string }
): Promise<TransferRequest> => {
  try {
    console.log('📤 Marking transfer as ready:', { id, packedBy: data.packedBy, notes: data.notes });
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.READY(id),
      {
        packedBy: data.packedBy,
        notes: data.notes || null,
      }
    );
    
    console.log('✅ Transfer marked as ready:', JSON.stringify(response));
    
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    }
    
    return unwrapTransferResponse(response);
    
  } catch (error: any) {
    console.error('❌ Error marking transfer as ready:', error);
    const errorMessage = error.response?.data?.message || 'Failed to mark transfer as ready';
    throw new Error(errorMessage);
  }
};

/**
 * Start delivery / pickup transfer
 * @param id - Transfer request ID
 * @param data - Carrier information
 * @returns Updated transfer request
 */
export const startDelivery = async (
  id: string,
  data: {
    carrierName: string;
    carrierPhone?: string;
    carrierVehicle?: string;
    estimatedDeliveryAt?: string;
  }
): Promise<TransferRequest> => {
  try {
    console.log('📤 Starting delivery:', { 
      id, 
      carrierName: data.carrierName, 
      carrierPhone: data.carrierPhone, 
      carrierVehicle: data.carrierVehicle,
      estimatedDeliveryAt: data.estimatedDeliveryAt
    });
    
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.PICKUP(id),
      {
        carrierName: data.carrierName,
        carrierPhone: data.carrierPhone || null,
        carrierVehicle: data.carrierVehicle || null,
        estimatedDeliveryAt: data.estimatedDeliveryAt || null,
      }
    );
    
    console.log('✅ Delivery started:', JSON.stringify(response));
    
    if (response?.data?.request) {
      return unwrapTransferResponse(response.data.request);
    } else if (response?.data) {
      return unwrapTransferResponse(response.data);
    }
    
    return unwrapTransferResponse(response);
    
  } catch (error: any) {
    console.error('❌ Error starting delivery:', error);
    const errorMessage = error.response?.data?.message || 'Failed to start delivery';
    throw new Error(errorMessage);
  }
};

/**
 * Mark transfer as delivered
 * @param id - Transfer request ID
 * @param data - Delivery notes (optional)
 * @returns Updated transfer request
 */
export const markAsDelivered = async (
  id: string,
  data?: { notes?: string }
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.DELIVER(id),
      data || {}
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error marking transfer ${id} as delivered:`, error);
    throw error;
  }
};

/**
 * Complete a transfer request
 * @param id - Transfer request ID
 * @returns Updated transfer request
 */
export const completeTransfer = async (
  id: string
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.COMPLETE(id)
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error completing transfer ${id}:`, error);
    throw error;
  }
};

/**
 * Get transfer history for a location
 * @param locationId - Location ID
 * @param locationType - Location type (STORE or WAREHOUSE)
 * @returns List of transfer requests
 */
export const getTransferHistory = async (
  locationId: string,
  locationType: string
): Promise<TransferRequest[]> => {
  try {
    const response = await apiClient.get<TransferRequest[]>(
      API_ENDPOINTS.TRANSFER_REQUESTS.HISTORY,
      {
        params: { locationId, locationType },
      }
    );
    return response;
  } catch (error) {
    console.error('❌ Error fetching transfer history:', error);
    throw error;
  }
};

/**
 * Get transfer summary statistics
 * @param filters - Optional filters for the summary
 * @returns Transfer history summary
 * @deprecated Backend endpoint not yet implemented - will return 404 until backend implements /api/transfers/summary
 */
export const getTransferSummary = async (
  filters?: TransferFilters
): Promise<TransferHistorySummary> => {
  // Note: This endpoint is not yet implemented in the backend
  // It has been removed from the config to avoid accidental use
  // but kept here for backward compatibility until the backend adds support
  const SUMMARY_ENDPOINT = '/api/transfers/summary';
  
  try {
    const response = await apiClient.get<TransferHistorySummary>(
      SUMMARY_ENDPOINT,
      {
        params: filters,
      }
    );
    return response;
  } catch (error) {
    console.error('❌ Error fetching transfer summary:', error);
    console.warn('⚠️  Backend endpoint /api/transfers/summary not yet implemented');
    throw error;
  }
};

/**
 * Export transfer history to CSV
 * Note: Returns CSV content as string
 */
export const exportTransferHistoryCSV = async (
  filters?: TransferFilters
): Promise<string> => {
  try {
    const response = await apiClient.get<string>(
      `${API_ENDPOINTS.TRANSFER_REQUESTS.HISTORY}/export/csv`,
      {
        params: filters,
        responseType: 'text',
      }
    );
    return response;
  } catch (error) {
    console.error('❌ Error exporting transfer history:', error);
    throw error;
  }
};

export default {
  createTransferRequest,
  getTransferRequests,
  getTransferRequestById,
  approveTransfer,
  approveAndSendTransfer,
  rejectTransfer,
  confirmReceipt,
  cancelTransfer,
  markAsReady,
  startDelivery,
  markAsDelivered,
  completeTransfer,
  getTransferHistory,
  getTransferSummary,
  exportTransferHistoryCSV,
};
