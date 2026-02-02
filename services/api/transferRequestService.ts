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
 * Backend may return { success: true, request: {...} } or just the transfer object
 */
const unwrapTransferResponse = (response: any): TransferRequest => {
  const transferData = response.request || response;
  
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
    if (Array.isArray(response)) {
      // Backend returned array directly
      console.log('📦 [API] Backend returned array directly');
      return {
        requests: response,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalElements: response.length,
          pageSize: size,
          hasNext: false,
          hasPrevious: false,
        },
      };
    } else if (response.pagination && response.requests) {
      // Backend returned new structure with nested pagination
      console.log('📦 [API] Backend returned paginated response with nested pagination');
      return response as PaginatedTransferResponse;
    } else if (response.requests) {
      // Backend returned old paginated response structure
      console.log('📦 [API] Backend returned old paginated response structure');
      // Convert old structure to new structure
      return {
        requests: response.requests,
        pagination: {
          currentPage: response.currentPage ?? page,
          totalPages: response.totalPages ?? 1,
          totalElements: response.totalItems ?? response.requests.length,
          pageSize: size,
          hasNext: response.hasMore ?? false,
          hasPrevious: page > 0,
        },
      };
    } else if ('data' in response && Array.isArray(response.data)) {
      // Backend returned { data: [...] }
      console.log('📦 [API] Backend returned data wrapper');
      return {
        requests: response.data,
        pagination: {
          currentPage: response.currentPage ?? page,
          totalPages: response.totalPages ?? 1,
          totalElements: response.totalItems ?? response.data.length,
          pageSize: size,
          hasNext: response.hasMore ?? false,
          hasPrevious: page > 0,
        },
      };
    } else {
      console.warn('⚠️ [API] Unexpected response format:', response);
      return {
        requests: [],
        pagination: {
          currentPage: 0,
          totalPages: 0,
          totalElements: 0,
          pageSize: size,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }
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
    
    // Backend returns { success: true, request: {...} }
    // Extract the actual transfer data from the wrapper
    const transferData = unwrapTransferResponse(response);
    
    // Debug logging (only in development)
    if (__DEV__) {
      console.log('📦 Transfer API response:', {
        hasRequest: !!response.request,
        hasSuccess: !!response.success,
        transferId: transferData?.id,
        status: transferData?.status,
        fromWarehouse: transferData?.fromWarehouse,
        toStore: transferData?.toStore,
      });
    }
    
    return transferData;
  } catch (error) {
    console.error(`❌ Error fetching transfer request ${id}:`, error);
    throw error;
  }
};

/**
 * Approve and send a transfer request (GM+ only)
 * @param id - Transfer request ID
 * @param sendData - Carrier and delivery information
 * @returns Updated transfer request
 */
export const approveAndSendTransfer = async (
  id: string,
  sendData: SendTransferDTO
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.SEND(id),
      sendData
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error approving transfer ${id}:`, error);
    throw error;
  }
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
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.REJECT(id),
      { reason }
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error rejecting transfer ${id}:`, error);
    throw error;
  }
};

/**
 * Confirm receipt of a transfer
 * @param id - Transfer request ID
 * @param receiptData - Receipt information
 * @returns Updated transfer request
 */
export const confirmReceipt = async (
  id: string,
  receiptData: ReceiptDTO
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.CONFIRM_RECEIPT(id),
      receiptData
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error confirming receipt for transfer ${id}:`, error);
    throw error;
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
    const response = await apiClient.put<any>(
      API_ENDPOINTS.TRANSFER_REQUESTS.CANCEL(id),
      { reason }
    );
    return unwrapTransferResponse(response);
  } catch (error) {
    console.error(`❌ Error cancelling transfer ${id}:`, error);
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
  approveAndSendTransfer,
  rejectTransfer,
  confirmReceipt,
  cancelTransfer,
  completeTransfer,
  getTransferHistory,
  getTransferSummary,
  exportTransferHistoryCSV,
};
