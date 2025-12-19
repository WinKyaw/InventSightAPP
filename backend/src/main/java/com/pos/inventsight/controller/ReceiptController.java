package com.pos.inventsight.controller;

import com.pos.inventsight.dto.ApiResponse;
import com.pos.inventsight.dto.SaleResponse;
import com.pos.inventsight.entity.Sale;
import com.pos.inventsight.entity.Store;
import com.pos.inventsight.entity.User;
import com.pos.inventsight.enums.UserRole;
import com.pos.inventsight.repository.SaleRepository;
import com.pos.inventsight.service.SaleService;
import com.pos.inventsight.service.UserActiveStoreService;
import com.pos.inventsight.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller for Receipt/Sale operations with GM+ support
 */
@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
public class ReceiptController {

    private final SaleService saleService;
    private final UserService userService;
    private final UserActiveStoreService userActiveStoreService;
    private final SaleRepository saleRepository;

    public ReceiptController(
            SaleService saleService,
            UserService userService,
            UserActiveStoreService userActiveStoreService,
            SaleRepository saleRepository) {
        this.saleService = saleService;
        this.userService = userService;
        this.userActiveStoreService = userActiveStoreService;
        this.saleRepository = saleRepository;
    }

    /**
     * GET /api/receipts - Get receipts with optional filters
     * GM+ sees all receipts, regular users see only their own
     */
    @GetMapping
    public ResponseEntity<?> getReceipts(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) UUID cashierId,  // Filter by specific cashier (GM+ only)
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username);
            
            // Get user's active store
            Store activeStore = userActiveStoreService.getUserActiveStoreOrThrow(user.getId());
            
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
            
            List<Sale> receipts;
            
            // If cashierId provided and user is GM+, filter by that cashier
            if (cashierId != null && isGMPlus(user)) {
                receipts = saleService.getReceiptsByStore(cashierId, activeStore.getId(), start, end);
            } else {
                receipts = saleService.getReceiptsByStore(user.getId(), activeStore.getId(), start, end);
            }
            
            // Convert to DTOs
            List<SaleResponse> response = receipts.stream()
                    .map(SaleResponse::fromEntity)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(false, "Error fetching receipts: " + e.getMessage()));
        }
    }

    /**
     * GET /api/receipts/recent - Get recent receipts
     */
    @GetMapping("/recent")
    public ResponseEntity<?> getRecentReceipts(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username);
            Store activeStore = userActiveStoreService.getUserActiveStoreOrThrow(user.getId());
            
            List<Sale> receipts = saleService.getRecentReceipts(user.getId(), activeStore.getId(), limit);
            
            List<SaleResponse> response = receipts.stream()
                    .map(SaleResponse::fromEntity)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(false, "Error fetching recent receipts: " + e.getMessage()));
        }
    }

    /**
     * GET /api/receipts/cashiers - Get list of cashiers with receipt counts (GM+ only)
     */
    @GetMapping("/cashiers")
    public ResponseEntity<?> getCashierStats(Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userService.getUserByUsername(username);
            
            if (!isGMPlus(user)) {
                return ResponseEntity.status(403)
                        .body(new ApiResponse(false, "Access denied. GM+ role required."));
            }
            
            Store activeStore = userActiveStoreService.getUserActiveStoreOrThrow(user.getId());
            
            // Get all receipts for store
            List<Sale> receipts = saleRepository.findByStoreId(activeStore.getId());
            
            // Group by cashier
            Map<String, Object> cashierStats = receipts.stream()
                    .collect(Collectors.groupingBy(
                            sale -> sale.getProcessedBy().getUsername(),
                            Collectors.collectingAndThen(
                                    Collectors.toList(),
                                    sales -> {
                                        Map<String, Object> stats = new HashMap<>();
                                        stats.put("cashierId", sales.get(0).getProcessedBy().getId().toString());
                                        stats.put("cashierName", sales.get(0).getProcessedBy().getFullName());
                                        stats.put("receiptCount", sales.size());
                                        stats.put("totalSales", sales.stream()
                                                .map(Sale::getTotalAmount)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                                        return stats;
                                    }
                            )
                    ));
            
            return ResponseEntity.ok(cashierStats);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(false, "Error fetching cashier stats: " + e.getMessage()));
        }
    }

    private boolean isGMPlus(User user) {
        return user.getRole() == UserRole.GENERAL_MANAGER || 
               user.getRole() == UserRole.CEO || 
               user.getRole() == UserRole.FOUNDER ||
               user.getRole() == UserRole.ADMIN;
    }
}
