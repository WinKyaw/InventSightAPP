package com.pos.inventsight.controller;

import com.pos.inventsight.entity.Store;
import com.pos.inventsight.repository.StoreRepository;
import com.pos.inventsight.service.UserActiveStoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Store controller for managing store operations
 */
@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*")
public class StoreController {

    private static final Logger logger = LoggerFactory.getLogger(StoreController.class);

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserActiveStoreService userActiveStoreService;

    /**
     * Get all stores
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStores() {
        logger.info("Fetching all stores");
        List<Store> stores = storeRepository.findAll();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Stores retrieved successfully");
        response.put("stores", stores.stream().map(this::mapStoreToResponse).toList());
        response.put("count", stores.size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get store by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStoreById(@PathVariable String id) {
        logger.info("Fetching store with ID: {}", id);
        Optional<Store> store = storeRepository.findById(UUID.fromString(id));
        
        if (store.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("store", mapStoreToResponse(store.get()));
            return ResponseEntity.ok(response);
        } else {
            logger.warn("Store not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Activate a store (set as current active store for the session)
     * This is a placeholder implementation - in production this would store the active store
     * in the user's session or update a user_active_store mapping table
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<Map<String, Object>> activateStore(@PathVariable String id) {
        logger.info("Activating store with ID: {}", id);
        
        Optional<Store> store = storeRepository.findById(UUID.fromString(id));
        
        if (store.isEmpty()) {
            logger.warn("Store not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
        
        // TODO: In production, store the active store ID in:
        // - Session attribute
        // - JWT token claim
        // - User database record
        // - Redis cache with user ID as key
        
        logger.info("Store {} activated successfully", store.get().getName());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Store activated successfully");
        response.put("store", mapStoreToResponse(store.get()));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Create a new store
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStore(@RequestBody Map<String, String> storeData) {
        logger.info("Creating new store: {}", storeData.get("storeName"));
        
        Store store = new Store();
        store.setName(storeData.get("storeName"));
        store.setAddress(storeData.get("address"));
        
        Store savedStore = storeRepository.save(store);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Store created successfully");
        response.put("store", mapStoreToResponse(savedStore));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Map Store entity to response format
     */
    private Map<String, Object> mapStoreToResponse(Store store) {
        Map<String, Object> storeMap = new HashMap<>();
        storeMap.put("id", store.getId().toString());
        storeMap.put("storeName", store.getName());
        storeMap.put("address", store.getAddress());
        storeMap.put("createdAt", store.getCreatedAt());
        storeMap.put("updatedAt", store.getUpdatedAt());
        return storeMap;
    }
}
