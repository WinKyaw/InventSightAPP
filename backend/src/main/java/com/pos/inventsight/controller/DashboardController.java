package com.pos.inventsight.controller;

import com.pos.inventsight.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for dashboard summary data.
 * Accepts an optional storeId query parameter to scope results to a specific store.
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/summary
     *
     * @param storeId Optional store UUID to filter results. When omitted, data is
     *                aggregated across all stores.
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            @RequestParam(required = false) String storeId) {

        logger.info("Dashboard summary requested, storeId={}", storeId);

        Map<String, Object> summary = dashboardService.getDashboardSummary(storeId);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        response.put("message", "Dashboard summary retrieved successfully");
        response.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

        return ResponseEntity.ok(response);
    }
}
