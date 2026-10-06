package com.markethub.modules.payment.gateway;

import com.markethub.modules.payment.dto.PaymentWebhookRequest;
import org.springframework.stereotype.Component;

/**
 * Default verifier used until a real gateway provider is integrated.
 * Rejects all webhooks so that unverifiable events are never trusted.
 */
@Component
public class NoOpPaymentWebhookVerifier implements PaymentWebhookVerifier {

    @Override
    public boolean verify(PaymentWebhookRequest request) {
        return false;
    }
}
