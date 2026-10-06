package com.markethub.modules.payment.service;

import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.dto.PaymentWebhookRequest;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;

import java.util.List;

public interface PaymentService {

    PaymentResponse initiatePayment(Long userId, Long orderId, PaymentMethod paymentMethod);

    PaymentResponse getPayment(Long userId, Long paymentId);

    PaymentResponse getPaymentByOrder(Long userId, Long orderId);

    List<PaymentResponse> getPaymentsForUser(Long userId);

    /**
     * Internal status transition used by future webhook/verification flows.
     * Not exposed to arbitrary customer updates.
     */
    PaymentResponse transitionStatus(Long paymentId, PaymentStatus newStatus);

    PaymentResponse processWebhook(PaymentWebhookRequest request);

    PaymentResponse initiatePayment(Long userId, Long orderId, PaymentMethod paymentMethod, String idempotencyKey);
}
