package com.markethub.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Provider-agnostic webhook payload. No provider-specific fields.
 */
public class PaymentWebhookRequest {

    /** Reference to the payment: gateway reference ID or internal payment reference. */
    @NotBlank
    private String paymentReference;

    /** Requested target status for the payment, e.g. AUTHORIZED, CAPTURED, FAILED. */
    @NotBlank
    private String status;

    @NotBlank
    private String eventId;

    @NotBlank
    private String signature;

    public PaymentWebhookRequest() {
    }

    public PaymentWebhookRequest(String paymentReference, String status, String eventId, String signature) {
        this.paymentReference = paymentReference;
        this.status = status;
        this.eventId = eventId;
        this.signature = signature;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }
}
