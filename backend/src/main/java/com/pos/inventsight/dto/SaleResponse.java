package com.pos.inventsight.dto;

import com.pos.inventsight.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Sale response DTO for API responses
 */
public class SaleResponse {
    private Long id;
    private String receiptNumber;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String status;
    private String storeId;
    private String storeName;
    private String processedById;
    private String processedByUsername;
    private String processedByFullName;
    private String paymentMethod;
    private String notes;
    private List<SaleItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SaleResponse fromEntity(Sale sale) {
        SaleResponse response = new SaleResponse();
        response.setId(sale.getId());
        response.setReceiptNumber(sale.getReceiptNumber());
        response.setCustomerName(sale.getCustomerName());
        response.setCustomerEmail(sale.getCustomerEmail());
        response.setCustomerPhone(sale.getCustomerPhone());
        response.setSubtotal(sale.getSubtotal());
        response.setTaxAmount(sale.getTaxAmount());
        response.setDiscountAmount(sale.getDiscountAmount());
        response.setTotalAmount(sale.getTotalAmount());
        response.setStatus(sale.getStatus());
        response.setPaymentMethod(sale.getPaymentMethod());
        response.setNotes(sale.getNotes());
        response.setCreatedAt(sale.getCreatedAt());
        response.setUpdatedAt(sale.getUpdatedAt());
        
        // Store info
        if (sale.getStore() != null) {
            response.setStoreId(sale.getStore().getId().toString());
            response.setStoreName(sale.getStore().getName());
        }
        
        // User info
        if (sale.getProcessedBy() != null) {
            response.setProcessedById(sale.getProcessedBy().getId().toString());
            response.setProcessedByUsername(sale.getProcessedBy().getUsername());
            response.setProcessedByFullName(sale.getProcessedBy().getFullName());
        }
        
        // Items
        if (sale.getItems() != null) {
            response.setItems(sale.getItems().stream()
                    .map(SaleItemResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        
        return response;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getProcessedById() {
        return processedById;
    }

    public void setProcessedById(String processedById) {
        this.processedById = processedById;
    }

    public String getProcessedByUsername() {
        return processedByUsername;
    }

    public void setProcessedByUsername(String processedByUsername) {
        this.processedByUsername = processedByUsername;
    }

    public String getProcessedByFullName() {
        return processedByFullName;
    }

    public void setProcessedByFullName(String processedByFullName) {
        this.processedByFullName = processedByFullName;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SaleItemResponse> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
