package com.pos.inventsight.service;

import com.pos.inventsight.entity.Sale;
import com.pos.inventsight.entity.SaleItem;
import com.pos.inventsight.repository.ProductRepository;
import com.pos.inventsight.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary(String storeId) {
        long totalProducts;
        long lowStockCount;
        long totalCategories;
        BigDecimal inventoryValue;
        List<Sale> allSales;
        List<Sale> recentSales;

        if (storeId != null && !storeId.isBlank()) {
            UUID storeUUID = UUID.fromString(storeId);
            totalProducts = productRepository.countByStoreId(storeUUID);
            lowStockCount = productRepository.countByStoreIdAndStockQuantityLessThan(storeUUID, LOW_STOCK_THRESHOLD);
            totalCategories = productRepository.countDistinctCategoriesByStoreId(storeUUID);
            inventoryValue = productRepository.sumInventoryValueByStoreId(storeUUID);
            allSales = saleRepository.findByStoreId(storeUUID);
            recentSales = saleRepository.findTop10ByStoreIdOrderByCreatedAtDesc(storeUUID);
        } else {
            totalProducts = productRepository.count();
            lowStockCount = productRepository.countByStockQuantityLessThan(LOW_STOCK_THRESHOLD);
            totalCategories = productRepository.countDistinctCategories();
            inventoryValue = productRepository.sumInventoryValue();
            allSales = saleRepository.findAll();
            recentSales = saleRepository.findTop10ByOrderByCreatedAtDesc();
        }

        if (inventoryValue == null) {
            inventoryValue = BigDecimal.ZERO;
        }

        long totalOrders = allSales.size();
        BigDecimal totalRevenue = allSales.stream()
                .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Revenue and order growth: current month vs previous month
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentPeriodStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime previousPeriodStart = currentPeriodStart.minusMonths(1);
        LocalDateTime previousPeriodEnd = currentPeriodStart;

        BigDecimal currentRevenue = allSales.stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(currentPeriodStart))
                .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal previousRevenue = allSales.stream()
                .filter(s -> s.getCreatedAt() != null
                        && !s.getCreatedAt().isBefore(previousPeriodStart)
                        && s.getCreatedAt().isBefore(previousPeriodEnd))
                .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long currentOrders = allSales.stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(currentPeriodStart))
                .count();

        long previousOrders = allSales.stream()
                .filter(s -> s.getCreatedAt() != null
                        && !s.getCreatedAt().isBefore(previousPeriodStart)
                        && s.getCreatedAt().isBefore(previousPeriodEnd))
                .count();

        double revenueGrowth = 0.0;
        if (previousRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueGrowth = currentRevenue.subtract(previousRevenue)
                    .divide(previousRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        double orderGrowth = 0.0;
        if (previousOrders > 0) {
            orderGrowth = ((double) (currentOrders - previousOrders) / previousOrders) * 100.0;
        }

        // Daily sales for the last 7 days
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> dailySalesList = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            LocalDateTime dayStart = day.atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            List<Sale> daySales = allSales.stream()
                    .filter(s -> s.getCreatedAt() != null
                            && !s.getCreatedAt().isBefore(dayStart)
                            && s.getCreatedAt().isBefore(dayEnd))
                    .collect(Collectors.toList());
            BigDecimal dayRevenue = daySales.stream()
                    .map(s -> s.getTotalAmount() != null ? s.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Map<String, Object> dayData = new LinkedHashMap<>();
            dayData.put("date", day.format(DateTimeFormatter.ISO_LOCAL_DATE));
            dayData.put("revenue", dayRevenue.doubleValue());
            dayData.put("orders", daySales.size());
            dailySalesList.add(dayData);
        }

        // Aggregate sale items across all sales for top selling items and best performer
        Map<String, Integer> quantityByProduct = new HashMap<>();
        Map<String, BigDecimal> revenueByProduct = new HashMap<>();
        for (Sale sale : allSales) {
            if (sale.getItems() == null) continue;
            for (SaleItem item : sale.getItems()) {
                if (item.getProductName() == null) continue;
                String name = item.getProductName();
                quantityByProduct.merge(name, item.getQuantity() != null ? item.getQuantity() : 0, Integer::sum);
                revenueByProduct.merge(name,
                        item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO,
                        BigDecimal::add);
            }
        }

        // Sort products by quantity sold descending
        List<String> sortedProducts = new ArrayList<>(quantityByProduct.keySet());
        sortedProducts.sort((a, b) -> Integer.compare(
                quantityByProduct.getOrDefault(b, 0),
                quantityByProduct.getOrDefault(a, 0)));

        List<Map<String, Object>> topSellingItemsList = new ArrayList<>();
        for (int i = 0; i < Math.min(5, sortedProducts.size()); i++) {
            String name = sortedProducts.get(i);
            Map<String, Object> itemData = new LinkedHashMap<>();
            itemData.put("name", name);
            itemData.put("quantity", quantityByProduct.getOrDefault(name, 0));
            itemData.put("revenue", revenueByProduct.getOrDefault(name, BigDecimal.ZERO).doubleValue());
            itemData.put("category", "");
            topSellingItemsList.add(itemData);
        }

        Map<String, Object> bestPerformer = null;
        if (!sortedProducts.isEmpty()) {
            String topName = sortedProducts.get(0);
            bestPerformer = new LinkedHashMap<>();
            bestPerformer.put("productName", topName);
            bestPerformer.put("totalSold", quantityByProduct.getOrDefault(topName, 0));
            bestPerformer.put("totalRevenue", revenueByProduct.getOrDefault(topName, BigDecimal.ZERO).doubleValue());
        }

        // Recent orders from the top-10 query
        List<Map<String, Object>> recentOrdersData = new ArrayList<>();
        for (Sale sale : recentSales) {
            Map<String, Object> orderData = new LinkedHashMap<>();
            orderData.put("id", sale.getId());
            orderData.put("receiptNumber", sale.getReceiptNumber());
            orderData.put("customerName", sale.getCustomerName());
            orderData.put("totalAmount", sale.getTotalAmount() != null ? sale.getTotalAmount().doubleValue() : 0.0);
            orderData.put("status", sale.getStatus());
            orderData.put("createdAt", sale.getCreatedAt() != null
                    ? sale.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
            recentOrdersData.add(orderData);
        }

        // Recent activities derived from recent sales
        List<Map<String, Object>> recentActivitiesData = new ArrayList<>();
        for (Sale sale : recentSales) {
            Map<String, Object> actData = new LinkedHashMap<>();
            actData.put("id", sale.getId());
            actData.put("type", "sale");
            if (sale.getItems() != null && !sale.getItems().isEmpty()) {
                int totalQty = sale.getItems().stream()
                        .mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
                String productName = sale.getItems().size() == 1
                        ? sale.getItems().get(0).getProductName()
                        : "Multiple items";
                actData.put("productName", productName);
                actData.put("quantity", totalQty);
            } else {
                actData.put("productName", sale.getCustomerName() != null ? sale.getCustomerName() : "Walk-in");
                actData.put("quantity", 1);
            }
            actData.put("totalValue", sale.getTotalAmount() != null ? sale.getTotalAmount().doubleValue() : 0.0);
            actData.put("timestamp", sale.getCreatedAt() != null
                    ? sale.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME) : null);
            recentActivitiesData.add(actData);
        }

        // Customer satisfaction: percentage of completed orders
        double customerSatisfaction = 0.0;
        if (totalOrders > 0) {
            long completedOrders = allSales.stream()
                    .filter(s -> "completed".equalsIgnoreCase(s.getStatus()))
                    .count();
            customerSatisfaction = (completedOrders * 100.0) / totalOrders;
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalProducts", totalProducts);
        // Both keys provided for backward compatibility: frontend may read either
        summary.put("lowStockCount", lowStockCount);
        summary.put("lowStockItems", lowStockCount);
        summary.put("totalCategories", totalCategories);
        summary.put("totalRevenue", totalRevenue.doubleValue());
        summary.put("totalOrders", totalOrders);
        summary.put("avgOrderValue", avgOrderValue.doubleValue());
        summary.put("inventoryValue", inventoryValue.doubleValue());
        summary.put("revenueGrowth", revenueGrowth);
        summary.put("orderGrowth", orderGrowth);
        summary.put("customerSatisfaction", customerSatisfaction);
        summary.put("recentActivities", recentActivitiesData);
        summary.put("recentOrders", recentOrdersData);
        summary.put("bestPerformer", bestPerformer);
        summary.put("dailySales", dailySalesList);
        summary.put("topSellingItems", topSellingItemsList);
        summary.put("lastUpdated", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

        return summary;
    }
}
