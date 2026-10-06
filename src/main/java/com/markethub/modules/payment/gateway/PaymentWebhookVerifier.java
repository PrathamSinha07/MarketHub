package com.markethub.modules.payment.gateway;

import com.markethub.modules.payment.dto.PaymentWebhookRequest;

/**
 * Provider-agnostic webhook signature verifier.
 * A real gateway integration will implement this with the provider's
 * signature scheme (e.g. HMAC). The default bean rejects everything.
 */
public interface PaymentWebhookVerifier {

    boolean verify(PaymentWebhookRequest request);
}
