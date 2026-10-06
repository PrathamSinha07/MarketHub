package com.markethub.modules.payment.service;

import com.markethub.common.exception.ApiException;
import com.markethub.common.exception.ResourceNotFoundException;
import com.markethub.modules.order.entity.Order;
import com.markethub.modules.order.entity.OrderStatus;
import com.markethub.modules.order.repository.OrderRepository;
import com.markethub.modules.payment.dto.PaymentResponse;
import com.markethub.modules.payment.entity.Payment;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;
import com.markethub.modules.payment.gateway.PaymentGateway;
import com.markethub.modules.payment.repository.PaymentRepository;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentGateway paymentGateway;
    @Mock
    private com.markethub.modules.payment.gateway.PaymentWebhookVerifier paymentWebhookVerifier;
    @Mock
    private com.markethub.modules.payment.repository.ProcessedWebhookEventRepository webhookEventRepository;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User customer;
    private User otherCustomer;
    private Order order;

    @BeforeEach
    void setUp() {
        customer = User.builder()
                .email("customer@example.com")
                .password("secret")
                .firstName("Test")
                .lastName("Customer")
                .role(Role.ROLE_CUSTOMER)
                .build();
        customer.setId(1L);

        otherCustomer = User.builder()
                .email("other@example.com")
                .password("secret")
                .firstName("Other")
                .lastName("Customer")
                .role(Role.ROLE_CUSTOMER)
                .build();
        otherCustomer.setId(2L);

        order = Order.builder()
                .user(customer)
                .status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("1299.50"))
                .build();
        order.setId(10L);

        lenient().when(paymentGateway.initiatePayment(any(Payment.class))).thenReturn(null);
    }

    private Payment savedPayment(Payment p) {
        p.setId(100L);
        return p;
    }

    @Test
    void initiatePayment_valid_createsPendingPayment() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.UPI);

        assertEquals(PaymentStatus.PENDING, response.getStatus());
        assertEquals(PaymentMethod.UPI, response.getPaymentMethod());
        assertEquals(10L, response.getOrderId());
        assertEquals(1L, response.getUserId());
    }

    @Test
    void initiatePayment_missingOrder_throwsNotFound() {
        when(orderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> paymentService.initiatePayment(1L, 99L, PaymentMethod.CARD));
    }

    @Test
    void initiatePayment_orderBelongsToAnotherCustomer_throwsForbidden() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        ApiException ex = assertThrows(ApiException.class,
                () -> paymentService.initiatePayment(2L, 10L, PaymentMethod.CARD));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void initiatePayment_cancelledOrder_rejected() {
        order.setStatus(OrderStatus.CANCELLED);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        ApiException ex = assertThrows(ApiException.class,
                () -> paymentService.initiatePayment(1L, 10L, PaymentMethod.CARD));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void initiatePayment_duplicateActivePayment_rejected() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(true);

        ApiException ex = assertThrows(ApiException.class,
                () -> paymentService.initiatePayment(1L, 10L, PaymentMethod.CARD));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void initiatePayment_amountComesFromOrderTotal() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.CARD);

        assertEquals(new BigDecimal("1299.50"), response.getAmount());
    }

    @Test
    void initiatePayment_currencyDefaultsToINR() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.WALLET);

        assertEquals("INR", response.getCurrency());
    }

    @Test
    void initiatePayment_gatewayReferenceInitiallyNull() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.COD);

        assertNull(response.getGatewayReferenceId());
    }

    @Test
    void initiatePayment_generatesInternalPaymentReference() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.NET_BANKING);

        org.junit.jupiter.api.Assertions.assertNotNull(response.getPaymentReference());
    }

    @Test
    void getPayment_ownerCanAccess() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getPayment(1L, 100L);

        assertEquals(100L, response.getPaymentId());
    }

    @Test
    void getPayment_otherCustomer_throwsForbidden() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.getPayment(2L, 100L));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void getPaymentByOrder_otherCustomer_throwsForbidden() {
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        ApiException ex = assertThrows(ApiException.class, () -> paymentService.getPaymentByOrder(2L, 10L));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void getPaymentByOrder_ownerCanAccess() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(10L)).thenReturn(Optional.of(payment));

        PaymentResponse response = paymentService.getPaymentByOrder(1L, 10L);

        assertEquals(100L, response.getPaymentId());
    }

    @Test
    void transitionStatus_validTransitions_applied() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse r1 = paymentService.transitionStatus(100L, PaymentStatus.AUTHORIZED);
        assertEquals(PaymentStatus.AUTHORIZED, r1.getStatus());

        PaymentResponse r2 = paymentService.transitionStatus(100L, PaymentStatus.CAPTURED);
        assertEquals(PaymentStatus.CAPTURED, r2.getStatus());

        PaymentResponse r3 = paymentService.transitionStatus(100L, PaymentStatus.REFUNDED);
        assertEquals(PaymentStatus.REFUNDED, r3.getStatus());
    }

    @Test
    void transitionStatus_pendingToFailed_valid() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentResponse response = paymentService.transitionStatus(100L, PaymentStatus.FAILED);
        assertEquals(PaymentStatus.FAILED, response.getStatus());
    }

    @Test
    void transitionStatus_capturedToPending_rejected() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.CAPTURED).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));

        assertThrows(ApiException.class, () -> paymentService.transitionStatus(100L, PaymentStatus.PENDING));
    }

    @Test
    void transitionStatus_pendingToRefunded_rejected() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));

        assertThrows(ApiException.class, () -> paymentService.transitionStatus(100L, PaymentStatus.REFUNDED));
    }

    @Test
    void initiatePayment_sameIdempotencyKey_returnsExistingPayment() {
        Payment existing = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").idempotencyKey("key-123").build();
        existing.setId(100L);
        when(paymentRepository.findByUserIdAndIdempotencyKey(1L, "key-123")).thenReturn(Optional.of(existing));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.CARD, "key-123");

        assertEquals(100L, response.getPaymentId());
        verify(paymentRepository, org.mockito.Mockito.never()).save(any(Payment.class));
    }

    @Test
    void initiatePayment_newIdempotencyKey_storesKey() {
        when(paymentRepository.findByUserIdAndIdempotencyKey(1L, "key-abc")).thenReturn(Optional.empty());
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(10L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(1L, 10L, PaymentMethod.CARD, "key-abc");

        assertEquals(PaymentStatus.PENDING, response.getStatus());
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals("key-abc", captor.getValue().getIdempotencyKey());
    }

    @Test
    void initiatePayment_differentCustomerSameKey_notAffected() {
        when(paymentRepository.findByUserIdAndIdempotencyKey(2L, "key-123")).thenReturn(Optional.empty());
        Order otherOrder = Order.builder().user(otherCustomer).status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("50.00")).build();
        otherOrder.setId(20L);
        when(orderRepository.findById(20L)).thenReturn(Optional.of(otherOrder));
        when(paymentRepository.existsByOrderIdAndStatusIn(eq(20L), anyCollection())).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> savedPayment(inv.getArgument(0)));

        PaymentResponse response = paymentService.initiatePayment(2L, 20L, PaymentMethod.UPI, "key-123");

        assertEquals(2L, response.getUserId());
        assertEquals(20L, response.getOrderId());
    }

    @Test
    void transitionStatus_refundedToAnything_rejected() {
        Payment payment = Payment.builder()
                .order(order).user(customer).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.REFUNDED).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-1").build();
        payment.setId(100L);
        when(paymentRepository.findById(100L)).thenReturn(Optional.of(payment));

        assertThrows(ApiException.class, () -> paymentService.transitionStatus(100L, PaymentStatus.PENDING));
        assertThrows(ApiException.class, () -> paymentService.transitionStatus(100L, PaymentStatus.CAPTURED));
    }
}
