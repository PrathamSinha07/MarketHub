package com.markethub.modules.payment.gateway;

import com.markethub.modules.payment.entity.Payment;

/**
 * Provider-agnostic abstraction for an external payment gateway.
 *
 * A real provider (Razorpay, Stripe, etc.) can be plugged in later by
 * implementing this interface. Until then a lightweight default
 * implementation is used; gateway references remain nullable until an
 * external gateway is actually integrated.
 */
public interface PaymentGateway {

    /**
     * Creates/initiates an external payment for the given payment.
     *
     * @return the external gateway reference ID, or null if the provider
     *         has not issued one yet
     */
    String initiatePayment(Payment payment);

    /**
     * Verifies a payment with the gateway using its reference ID.
     * Must be called before trusting gateway-reported status.
     *
     * @return true when the gateway confirms the payment is valid
     */
    boolean verifyPayment(String gatewayReferenceId);
}
