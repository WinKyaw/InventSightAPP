import { useState, useEffect, useCallback } from 'react';
import {
  TransferRequest,
  TransferFilters,
  PaginatedTransferResponse,
} from '../types/transfer';
import {
  getTransferRequests,
  getTransferRequestById,
} from '../services/api/transferRequestService';

/**
 * Hook for managing transfer requests with pagination and filtering
 */
export function useTransferRequests(
  initialFilters?: TransferFilters,
  initialPage: number = 0,
  pageSize: number = 20
) {
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransferFilters | undefined>(
    initialFilters
  );
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch transfer requests from API
   */
  const fetchTransfers = useCallback(
    async (page: number = currentPage, newFilters?: TransferFilters) => {
      try {
        setLoading(true);
        setError(null);

        const appliedFilters = newFilters || filters;
        const response: PaginatedTransferResponse = await getTransferRequests(
          appliedFilters,
          page,
          pageSize
        );

        setTransfers(response.items || []);
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalItems);
        setHasMore(response.hasMore);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch transfers';
        setError(errorMessage);
        console.error('Error fetching transfers:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, filters, pageSize]
  );

  /**
   * Refresh the current page
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransfers(currentPage, filters);
  }, [fetchTransfers, currentPage, filters]);

  /**
   * Load next page
   */
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchTransfers(currentPage + 1, filters);
    }
  }, [loading, hasMore, fetchTransfers, currentPage, filters]);

  /**
   * Apply new filters and reset to first page
   */
  const applyFilters = useCallback(
    async (newFilters: TransferFilters) => {
      setFilters(newFilters);
      setCurrentPage(0);
      await fetchTransfers(0, newFilters);
    },
    [fetchTransfers]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(async () => {
    setFilters(undefined);
    setCurrentPage(0);
    await fetchTransfers(0, undefined);
  }, [fetchTransfers]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 0 && page < totalPages) {
        await fetchTransfers(page, filters);
      }
    },
    [fetchTransfers, totalPages, filters]
  );

  // Initial fetch
  useEffect(() => {
    fetchTransfers(currentPage, filters);
  }, []); // Only run once on mount

  return {
    transfers,
    loading,
    error,
    refreshing,
    currentPage,
    totalPages,
    totalItems,
    hasMore,
    filters,
    refresh,
    loadMore,
    applyFilters,
    clearFilters,
    goToPage,
  };
}

/**
 * Hook for managing a single transfer request
 */
export function useTransferRequest(transferId: string) {
  const [transfer, setTransfer] = useState<TransferRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch transfer details
   */
  const fetchTransfer = useCallback(async () => {
    if (!transferId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getTransferRequestById(transferId);
      setTransfer(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch transfer details';
      setError(errorMessage);
      console.error('Error fetching transfer:', err);
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  /**
   * Refresh transfer details
   */
  const refresh = useCallback(async () => {
    await fetchTransfer();
  }, [fetchTransfer]);

  // Initial fetch
  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  return {
    transfer,
    loading,
    error,
    refresh,
    setTransfer, // Allow manual updates after mutations
  };
}
