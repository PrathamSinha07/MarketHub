package com.markethub.modules.payment.gateway;

import com.markethub.modules.payment.entity.Payment;
import org.springframework.stereotype.Component;

/**
 * Default no-op gateway used until a real external provider is integrated.
 * Returns no gateway reference and does not report successful verification
 * for payments that were never created externally.
 */
@Component
public class NoOpPaymentGateway implements PaymentGateway {

    @Override
    public String initiatePayment(Payment payment) {
        return null;
    }

    @Override
    public boolean verifyPayment(String gatewayReferenceId) {
        return false;
    }
}
