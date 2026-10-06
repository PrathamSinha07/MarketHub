package com.markethub.modules.payment.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.order.entity.Order;
import com.markethub.modules.order.entity.OrderStatus;
import com.markethub.modules.order.repository.OrderRepository;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.dto.PaymentWebhookRequest;
import com.markethub.modules.payment.entity.Payment;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;
import com.markethub.modules.payment.gateway.PaymentGateway;
import com.markethub.modules.payment.gateway.PaymentWebhookVerifier;
import com.markethub.modules.payment.repository.PaymentRepository;
import com.markethub.modules.payment.repository.ProcessedWebhookEventRepository;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentGateway paymentGateway;
    @Mock private PaymentWebhookVerifier paymentWebhookVerifier;
    @Mock private ProcessedWebhookEventRepository webhookEventRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User customer;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        customer = User.builder().email("c@example.com").password("x")
                .firstName("C").lastName("U").role(Role.ROLE_CUSTOMER).build();
        customer.setId(1L);
        order = Order.builder().user(customer).status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("100.00")).build();
        order.setId(10L);
        payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").gatewayReferenceId("gw-123").build();
        payment.setId(100L);
    }

    private PaymentWebhookRequest webhook(String status) {
        return new PaymentWebhookRequest("gw-123", status, "evt-1", "sig-abc");
    }

    @Test
    void validWebhook_acceptedAndStatusTransitioned() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse response = paymentService.processWebhook(webhook("CAPTURED"));

        assertEquals(PaymentStatus.CAPTURED, response.getStatus());
        verify(webhookEventRepository).save(any());
    }

    @Test
    void invalidSignature_rejected() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.processWebhook(webhook("CAPTURED")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(paymentRepository, never()).save(any());
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void missingSignature_rejected() {
        PaymentWebhookRequest request = webhook("CAPTURED");
        request.setSignature("  ");

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.processWebhook(request));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void unknownPaymentReference_handledSafely() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.empty());
        when(paymentRepository.findByPaymentReference("gw-123")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.processWebhook(webhook("CAPTURED")));
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void validStatusTransition_succeeds() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse response = paymentService.processWebhook(webhook("AUTHORIZED"));

        assertEquals(PaymentStatus.AUTHORIZED, response.getStatus());
    }

    @Test
    void invalidStatusTransition_rejected() {
        payment.setStatus(PaymentStatus.FAILED);
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.processWebhook(webhook("CAPTURED")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(paymentRepository, never()).save(any());
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void capturedToPending_rejected() {
        payment.setStatus(PaymentStatus.CAPTURED);
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));

        assertThrows(ApiException.class, () -> paymentService.processWebhook(webhook("PENDING")));
    }

    @Test
    void duplicateEventId_isHarmless_noDoubleTransition() {
        payment.setStatus(PaymentStatus.CAPTURED);
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(true);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.processWebhook(webhook("CAPTURED"));

        assertEquals(PaymentStatus.CAPTURED, response.getStatus());
        verify(paymentRepository, never()).save(any());
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void webhook_sameEventDeliveredTwice_doesNotChangePaymentTwice() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false, true);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse first = paymentService.processWebhook(webhook("CAPTURED"));
        assertEquals(PaymentStatus.CAPTURED, first.getStatus());

        PaymentResponse second = paymentService.processWebhook(webhook("CAPTURED"));
        assertEquals(PaymentStatus.CAPTURED, second.getStatus());
        verify(webhookEventRepository, org.mockito.Mockito.times(1)).save(any());
    }

    @Test
    void webhookFailure_eventNotPersisted_allowsSafeRetry() {
        payment.setStatus(PaymentStatus.REFUNDED);
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));

        assertThrows(ApiException.class, () -> paymentService.processWebhook(webhook("CAPTURED")));
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void webhook_unknownStatus_rejected() {
        when(paymentWebhookVerifier.verify(any())).thenReturn(true);
        when(webhookEventRepository.existsByEventId("evt-1")).thenReturn(false);
        when(paymentRepository.findByGatewayReferenceId("gw-123")).thenReturn(Optional.of(payment));

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.processWebhook(webhook("BOGUS")));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }
}
