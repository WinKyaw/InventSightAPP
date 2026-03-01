package com.pos.inventsight.service;

import com.pos.inventsight.repository.ProductRepository;
import com.pos.inventsight.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for dashboard summary data, scoped to the active store when storeId is provided.
 */
@Service
public class DashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProductRepository productRepository;
    private final SaleRepository saleRepository;

    public DashboardService(
            ProductRepository productRepository,
            SaleRepository saleRepository) {
        this.productRepository = productRepository;
        this.saleRepository = saleRepository;
    }

    /**
     * Build a dashboard summary, optionally scoped to a specific store.
     *
     * @param storeId Optional store UUID string. When provided, product counts are
     *                filtered to only that store. Pass null to aggregate all stores.
     * @return A map representing the DashboardSummary expected by the frontend.
     */
    public Map<String, Object> getDashboardSummary(String storeId) {
        long totalProducts;
        long lowStockCount;
        long totalOrders;
        BigDecimal totalRevenue;

        if (storeId != null && !storeId.isBlank()) {
            UUID storeUUID = UUID.fromString(storeId);
            totalProducts = productRepository.countByStoreId(storeUUID);
            lowStockCount = productRepository.countByStoreIdAndStockQuantityLessThan(storeUUID, LOW_STOCK_THRESHOLD);

            var sales = saleRepository.findByStoreId(storeUUID);
            totalOrders = sales.size();
            totalRevenue = sales.stream()
                    .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            totalProducts = productRepository.count();
            lowStockCount = productRepository.countByStockQuantityLessThan(LOW_STOCK_THRESHOLD);

            var allSales = saleRepository.findAll();
            totalOrders = allSales.size();
            totalRevenue = allSales.stream()
                    .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalProducts", totalProducts);
        // Both keys provided for backward compatibility: frontend may read either
        summary.put("lowStockCount", lowStockCount);
        summary.put("lowStockItems", lowStockCount);
        summary.put("totalCategories", 0);
        summary.put("totalRevenue", totalRevenue.doubleValue());
        summary.put("totalOrders", totalOrders);
        summary.put("avgOrderValue", avgOrderValue.doubleValue());
        summary.put("inventoryValue", 0);
        summary.put("revenueGrowth", 0);
        summary.put("orderGrowth", 0);
        summary.put("customerSatisfaction", 0);
        summary.put("recentActivities", new Object[0]);
        summary.put("recentOrders", new Object[0]);
        summary.put("bestPerformer", null);
        summary.put("dailySales", new Object[0]);
        summary.put("topSellingItems", new Object[0]);
        summary.put("lastUpdated", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

        return summary;
    }
}
