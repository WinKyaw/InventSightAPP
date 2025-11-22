package com.pos.inventsight.repository;

import com.pos.inventsight.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Product entity operations
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findBySku(String sku);
    
    Optional<Product> findByBarcode(String barcode);
    
    boolean existsBySku(String sku);
    
    boolean existsByBarcode(String barcode);
}