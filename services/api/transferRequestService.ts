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
 * Create a new transfer request
 * @param request - Transfer request data
 * @returns Created transfer request
 */
export const createTransferRequest = async (
  request: CreateTransferRequestDTO
): Promise<TransferRequest> => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSFER_REQUESTS.CREATE,
      request
    );
    return response.data;
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
    const params = {
      page,
      size,
      ...filters,
    };
    
    const response = await apiClient.get(API_ENDPOINTS.TRANSFER_REQUESTS.ALL, {
      params,
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transfer requests:', error);
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
    const response = await apiClient.get(
      API_ENDPOINTS.TRANSFER_REQUESTS.BY_ID(id)
    );
    return response.data;
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
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSFER_REQUESTS.SEND(id),
      sendData
    );
    return response.data;
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
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSFER_REQUESTS.REJECT(id),
      { reason }
    );
    return response.data;
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
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSFER_REQUESTS.CONFIRM_RECEIPT(id),
      receiptData
    );
    return response.data;
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
    const response = await apiClient.post(
      API_ENDPOINTS.TRANSFER_REQUESTS.CANCEL(id),
      { reason }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Error cancelling transfer ${id}:`, error);
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
    const response = await apiClient.get(
      API_ENDPOINTS.TRANSFER_REQUESTS.HISTORY,
      {
        params: { locationId, locationType },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transfer history:', error);
    throw error;
  }
};

/**
 * Get transfer summary statistics
 * @param filters - Optional filters for the summary
 * @returns Transfer history summary
 */
export const getTransferSummary = async (
  filters?: TransferFilters
): Promise<TransferHistorySummary> => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.TRANSFER_REQUESTS.SUMMARY,
      {
        params: filters,
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching transfer summary:', error);
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
    const response = await apiClient.get(
      `${API_ENDPOINTS.TRANSFER_REQUESTS.HISTORY}/export/csv`,
      {
        params: filters,
        responseType: 'text',
      }
    );
    return response.data;
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
  getTransferHistory,
  getTransferSummary,
  exportTransferHistoryCSV,
};
