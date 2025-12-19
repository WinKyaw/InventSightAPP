package com.pos.inventsight.service;

import com.pos.inventsight.entity.Store;
import com.pos.inventsight.repository.StoreRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for managing user active stores
 * Simplified version - assumes user has an active store
 */
@Service
public class UserActiveStoreService {

    private final StoreRepository storeRepository;

    public UserActiveStoreService(StoreRepository storeRepository) {
        this.storeRepository = storeRepository;
    }

    public Store getUserActiveStoreOrThrow(UUID userId) {
        // Simplified: return first store or throw
        // In a real implementation, this would query a user_active_store mapping
        return storeRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active store found for user: " + userId));
    }
}
