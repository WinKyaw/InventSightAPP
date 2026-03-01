package com.pos.inventsight.repository;

import com.pos.inventsight.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Product entity operations
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);
    
    Optional<Product> findByBarcode(String barcode);
    
    boolean existsBySku(String sku);
    
    boolean existsByBarcode(String barcode);

    long countByStoreId(UUID storeId);

    long countByStoreIdAndStockQuantityLessThan(UUID storeId, int quantity);

    long countByStockQuantityLessThan(int quantity);

    @Query("SELECT COUNT(DISTINCT p.categoryId) FROM Product p WHERE p.categoryId IS NOT NULL")
    long countDistinctCategories();

    @Query("SELECT COUNT(DISTINCT p.categoryId) FROM Product p WHERE p.store.id = :storeId AND p.categoryId IS NOT NULL")
    long countDistinctCategoriesByStoreId(@Param("storeId") UUID storeId);

    @Query("SELECT COALESCE(SUM(p.price * p.stockQuantity), 0) FROM Product p")
    BigDecimal sumInventoryValue();

    @Query("SELECT COALESCE(SUM(p.price * p.stockQuantity), 0) FROM Product p WHERE p.store.id = :storeId")
    BigDecimal sumInventoryValueByStoreId(@Param("storeId") UUID storeId);
}