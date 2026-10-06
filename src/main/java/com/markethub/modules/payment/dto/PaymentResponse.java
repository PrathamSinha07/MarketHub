package com.markethub.modules.payment.dto;

import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long paymentId;
    private Long orderId;
    private Long userId;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private BigDecimal amount;
    private String currency;
    private String paymentReference;
    private String gatewayReferenceId;
    private LocalDateTime createdAt;

    public PaymentResponse() {
    }

    public PaymentResponse(Long paymentId, Long orderId, Long userId, PaymentMethod paymentMethod,
                           PaymentStatus status, BigDecimal amount, String currency,
                           String paymentReference, String gatewayReferenceId, LocalDateTime createdAt) {
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.userId = userId;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.amount = amount;
        this.currency = currency;
        this.paymentReference = paymentReference;
        this.gatewayReferenceId = gatewayReferenceId;
        this.createdAt = createdAt;
    }

    public Long getPaymentId() { return paymentId; }
    public Long getOrderId() { return orderId; }
    public Long getUserId() { return userId; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public PaymentStatus getStatus() { return status; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getPaymentReference() { return paymentReference; }
    public String getGatewayReferenceId() { return gatewayReferenceId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
