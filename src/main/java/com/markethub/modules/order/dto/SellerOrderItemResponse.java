package com.markethub.modules.order.dto;

import com.markethub.modules.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SellerOrderItemResponse {

    private Long orderId;
    private Long orderItemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private OrderStatus orderStatus;
    private LocalDateTime orderCreatedAt;

    public SellerOrderItemResponse() {
    }

    public SellerOrderItemResponse(Long orderId, Long orderItemId, Long productId, String productName,
                                   Integer quantity, BigDecimal unitPrice, BigDecimal subtotal,
                                   OrderStatus orderStatus, LocalDateTime orderCreatedAt) {
        this.orderId = orderId;
        this.orderItemId = orderItemId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.orderStatus = orderStatus;
        this.orderCreatedAt = orderCreatedAt;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getOrderItemId() {
        return orderItemId;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public LocalDateTime getOrderCreatedAt() {
        return orderCreatedAt;
    }
}
