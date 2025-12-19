package com.pos.inventsight.repository;

import com.pos.inventsight.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Sale entity with support for multi-user queries
 */
@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    
    // Find by store ID
    List<Sale> findByStoreId(UUID storeId);
    
    Page<Sale> findByStoreId(UUID storeId, Pageable pageable);
    
    // Find by store and date range
    List<Sale> findByStoreIdAndCreatedAtBetween(UUID storeId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find by user and store
    List<Sale> findByProcessedByIdAndStoreId(UUID userId, UUID storeId);
    
    Page<Sale> findByProcessedByIdAndStoreId(UUID userId, UUID storeId, Pageable pageable);
    
    // Find by user, store, and date range
    List<Sale> findByProcessedByIdAndStoreIdAndCreatedAtBetween(
        UUID userId, UUID storeId, LocalDateTime startDate, LocalDateTime endDate
    );
}
