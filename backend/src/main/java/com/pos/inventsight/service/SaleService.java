package com.pos.inventsight.service;

import com.pos.inventsight.entity.Sale;
import com.pos.inventsight.entity.User;
import com.pos.inventsight.enums.UserRole;
import com.pos.inventsight.repository.SaleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service for Sale/Receipt operations with GM+ role support
 */
@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final UserService userService;

    public SaleService(SaleRepository saleRepository, UserService userService) {
        this.saleRepository = saleRepository;
        this.userService = userService;
    }

    /**
     * Get all receipts for a store (GM+ only)
     * Regular users only see their own receipts
     */
    public List<Sale> getReceiptsByStore(UUID userId, UUID storeId, LocalDateTime startDate, LocalDateTime endDate) {
        User user = userService.getUserById(userId);
        
        // Check if user is GM+
        boolean isGMPlus = user.getRole() == UserRole.GENERAL_MANAGER || 
                           user.getRole() == UserRole.CEO || 
                           user.getRole() == UserRole.FOUNDER ||
                           user.getRole() == UserRole.ADMIN;
        
        if (isGMPlus) {
            // GM+ can see all receipts for the store
            System.out.println("🔓 GM+ user " + user.getUsername() + " accessing all store receipts");
            
            if (startDate != null && endDate != null) {
                return saleRepository.findByStoreIdAndCreatedAtBetween(storeId, startDate, endDate);
            } else {
                return saleRepository.findByStoreId(storeId);
            }
        } else {
            // Regular users only see their own receipts
            System.out.println("🔒 Regular user " + user.getUsername() + " accessing own receipts only");
            
            if (startDate != null && endDate != null) {
                return saleRepository.findByProcessedByIdAndStoreIdAndCreatedAtBetween(
                    userId, storeId, startDate, endDate
                );
            } else {
                return saleRepository.findByProcessedByIdAndStoreId(userId, storeId);
            }
        }
    }

    /**
     * Get all receipts for a store without user filtering (GM+ only)
     * This is used when GM+ wants to see ALL receipts regardless of cashier
     */
    public List<Sale> getAllReceiptsForStore(UUID storeId, LocalDateTime startDate, LocalDateTime endDate) {
        System.out.println("📋 Getting all receipts for store: " + storeId);
        
        if (startDate != null && endDate != null) {
            return saleRepository.findByStoreIdAndCreatedAtBetween(storeId, startDate, endDate);
        } else {
            return saleRepository.findByStoreId(storeId);
        }
    }

    /**
     * Get recent receipts (last N) for current user or all users if GM+
     */
    public List<Sale> getRecentReceipts(UUID userId, UUID storeId, int limit) {
        User user = userService.getUserById(userId);
        
        boolean isGMPlus = user.getRole() == UserRole.GENERAL_MANAGER || 
                           user.getRole() == UserRole.CEO || 
                           user.getRole() == UserRole.FOUNDER ||
                           user.getRole() == UserRole.ADMIN;
        
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        if (isGMPlus) {
            return saleRepository.findByStoreId(storeId, pageable).getContent();
        } else {
            return saleRepository.findByProcessedByIdAndStoreId(userId, storeId, pageable).getContent();
        }
    }

    /**
     * Save a sale/receipt
     */
    public Sale save(Sale sale) {
        return saleRepository.save(sale);
    }

    /**
     * Get sale by ID
     */
    public Sale getById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale not found with ID: " + id));
    }
    
    /**
     * Get receipts by status (e.g., PENDING, PROCESSING, COMPLETED)
     * GM+ can see all or filter by specific cashier, regular users see only their own
     * 
     * @param requestingUserId The ID of the user making the request (for permission check)
     * @param storeId The store to filter by
     * @param status The receipt status to filter by
     * @param filterByCashierId Optional cashier ID to filter by (GM+ only)
     */
    public List<Sale> getReceiptsByStatus(UUID requestingUserId, UUID storeId, String status, UUID filterByCashierId) {
        User requestingUser = userService.getUserById(requestingUserId);
        
        // Check if requesting user is GM+
        boolean isGMPlus = requestingUser.getRole() == UserRole.GENERAL_MANAGER || 
                           requestingUser.getRole() == UserRole.CEO || 
                           requestingUser.getRole() == UserRole.FOUNDER ||
                           requestingUser.getRole() == UserRole.ADMIN;
        
        if (isGMPlus) {
            if (filterByCashierId != null) {
                // GM+ filtering by specific cashier
                System.out.println("🔓 GM+ user " + requestingUser.getUsername() + 
                    " accessing receipts for cashier " + filterByCashierId + " with status: " + status);
                return saleRepository.findByProcessedByIdAndStoreIdAndStatus(filterByCashierId, storeId, status);
            } else {
                // GM+ seeing all receipts for the store with this status
                System.out.println("🔓 GM+ user " + requestingUser.getUsername() + 
                    " accessing all receipts with status: " + status);
                return saleRepository.findByStoreIdAndStatus(storeId, status);
            }
        } else {
            // Regular users only see their own receipts with this status
            System.out.println("🔒 Regular user " + requestingUser.getUsername() + 
                " accessing own receipts with status: " + status);
            return saleRepository.findByProcessedByIdAndStoreIdAndStatus(requestingUserId, storeId, status);
        }
    }
}
