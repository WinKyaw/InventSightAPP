package com.pos.inventsight.controller;

import com.pos.inventsight.entity.Product;
import com.pos.inventsight.repository.ProductRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Example Product controller to demonstrate exception handling
 * in action with database constraint violations
 */
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);

    @Autowired
    private ProductRepository productRepository;

    /**
     * Get all products
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        logger.info("Fetching all products");
        List<Product> products = productRepository.findAll();
        return ResponseEntity.ok(products);
    }

    /**
     * Get product by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        logger.info("Fetching product with ID: {}", id);
        Optional<Product> product = productRepository.findById(id);
        
        if (product.isPresent()) {
            return ResponseEntity.ok(product.get());
        } else {
            logger.warn("Product not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new product - demonstrates constraint violation handling
     * Try creating products with duplicate SKU or barcode to see exception handling
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        logger.info("Creating new product: {}", product);
        
        // This will trigger constraint violations if:
        // - SKU already exists (unique constraint)
        // - Barcode already exists (unique constraint)
        // - Required fields are null (not-null constraint)
        // - Validation annotations fail (price <= 0, blank name, etc.)
        Product savedProduct = productRepository.save(product);
        
        logger.info("Product created successfully with ID: {}", savedProduct.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    /**
     * Update an existing product
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        logger.info("Updating product with ID: {}", id);
        
        Optional<Product> productOptional = productRepository.findById(id);
        
        if (productOptional.isPresent()) {
            Product product = productOptional.get();
            product.setName(productDetails.getName());
            product.setSku(productDetails.getSku());
            product.setBarcode(productDetails.getBarcode());
            product.setPrice(productDetails.getPrice());
            product.setStockQuantity(productDetails.getStockQuantity());
            product.setDescription(productDetails.getDescription());
            product.setCategoryId(productDetails.getCategoryId());
            
            // This may trigger constraint violations if updating to duplicate values
            Product updatedProduct = productRepository.save(product);
            
            logger.info("Product updated successfully: {}", updatedProduct);
            return ResponseEntity.ok(updatedProduct);
        } else {
            logger.warn("Product not found for update with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a product
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        logger.info("Deleting product with ID: {}", id);
        
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            logger.info("Product deleted successfully with ID: {}", id);
            return ResponseEntity.noContent().build();
        } else {
            logger.warn("Product not found for deletion with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Example endpoint to intentionally trigger a constraint violation
     * for testing exception handling
     */
    @PostMapping("/test-constraint-violation")
    public ResponseEntity<Product> testConstraintViolation() {
        logger.info("Testing constraint violation");
        
        // Create a product with null required fields to trigger constraint violations
        Product invalidProduct = new Product();
        invalidProduct.setName(null); // Will trigger not-null constraint
        invalidProduct.setSku(null);  // Will trigger not-null constraint
        invalidProduct.setPrice(null); // Will trigger not-null constraint
        
        // This will be caught by the GlobalExceptionHandler
        Product savedProduct = productRepository.save(invalidProduct);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    /**
     * Example endpoint to test foreign key constraint violations
     */
    @PostMapping("/test-fk-violation")
    public ResponseEntity<Product> testForeignKeyViolation(@RequestBody Product product) {
        logger.info("Testing foreign key constraint violation");
        
        // Set a non-existent category ID to trigger FK constraint violation
        product.setCategoryId(99999L);
        
        // This will be caught by the GlobalExceptionHandler if FK constraints are enabled
        Product savedProduct = productRepository.save(product);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }
}