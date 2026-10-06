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
import com.markethub.modules.payment.entity.ProcessedWebhookEvent;
import com.markethub.modules.payment.gateway.PaymentGateway;
import com.markethub.modules.payment.gateway.PaymentWebhookVerifier;
import com.markethub.modules.payment.repository.PaymentRepository;
import com.markethub.modules.payment.repository.ProcessedWebhookEventRepository;
import com.markethub.modules.payment.dto.PaymentWebhookRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final String DEFAULT_CURRENCY = "INR";
    private static final Set<PaymentStatus> ACTIVE_STATUSES =
            EnumSet.of(PaymentStatus.PENDING, PaymentStatus.AUTHORIZED);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentWebhookVerifier paymentWebhookVerifier;
    private final ProcessedWebhookEventRepository webhookEventRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository,
                              PaymentGateway paymentGateway,
                              PaymentWebhookVerifier paymentWebhookVerifier,
                              ProcessedWebhookEventRepository webhookEventRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentGateway = paymentGateway;
        this.paymentWebhookVerifier = paymentWebhookVerifier;
        this.webhookEventRepository = webhookEventRepository;
    }

    @Override
    @Transactional
    public PaymentResponse initiatePayment(Long userId, Long orderId, PaymentMethod paymentMethod) {
        return initiatePayment(userId, orderId, paymentMethod, null);
    }

    @Override
    @Transactional
    public PaymentResponse initiatePayment(Long userId, Long orderId, PaymentMethod paymentMethod, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<Payment> existing = paymentRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
            if (existing.isPresent()) {
                return toResponse(existing.get());
            }
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to pay for this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot initiate payment for a cancelled order");
        }

        if (paymentRepository.existsByOrderIdAndStatusIn(orderId, ACTIVE_STATUSES)) {
            throw new ApiException(HttpStatus.CONFLICT, "An active payment already exists for this order");
        }

        Payment payment = Payment.builder()
                .order(order)
                .user(order.getUser())
                .paymentMethod(paymentMethod)
                .status(PaymentStatus.PENDING)
                .amount(order.getTotalAmount())
                .currency(DEFAULT_CURRENCY)
                .paymentReference(generatePaymentReference())
                .idempotencyKey(idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey)
                .build();

        // May be null until a real external gateway is integrated.
        payment.setGatewayReferenceId(paymentGateway.initiatePayment(payment));

        return toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this payment");
        }

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to access this order");
        }

        Payment payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsForUser(Long userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PaymentResponse transitionStatus(Long paymentId, PaymentStatus newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (!payment.getStatus().canTransitionTo(newStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid payment status transition from " + payment.getStatus() + " to " + newStatus);
        }

        payment.setStatus(newStatus);
        return toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponse processWebhook(PaymentWebhookRequest request) {
        if (request.getSignature() == null || request.getSignature().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing webhook signature");
        }

        if (!paymentWebhookVerifier.verify(request)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Webhook verification failed");
        }

        // Idempotent: a repeated delivery of the same event is a no-op.
        if (webhookEventRepository.existsByEventId(request.getEventId())) {
            return paymentRepository.findByGatewayReferenceId(request.getPaymentReference())
                    .or(() -> paymentRepository.findByPaymentReference(request.getPaymentReference()))
                    .map(this::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment", "reference", request.getPaymentReference()));
        }

        Payment payment = paymentRepository.findByGatewayReferenceId(request.getPaymentReference())
                .or(() -> paymentRepository.findByPaymentReference(request.getPaymentReference()))
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "reference", request.getPaymentReference()));

        PaymentStatus newStatus;
        try {
            newStatus = PaymentStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown payment status: " + request.getStatus());
        }

        if (payment.getStatus() != newStatus) {
            if (!payment.getStatus().canTransitionTo(newStatus)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Invalid payment status transition from " + payment.getStatus() + " to " + newStatus);
            }
            payment.setStatus(newStatus);
            paymentRepository.save(payment);
        }

        webhookEventRepository.save(ProcessedWebhookEvent.builder()
                .eventId(request.getEventId())
                .gatewayReferenceId(request.getPaymentReference())
                .paymentReference(payment.getPaymentReference())
                .status(newStatus.name())
                .build());

        return toResponse(payment);
    }

    private String generatePaymentReference() {
        return "PAY-" + UUID.randomUUID();
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrder().getId(),
                payment.getUser().getId(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentReference(),
                payment.getGatewayReferenceId(),
                payment.getCreatedAt()
        );
    }
}
