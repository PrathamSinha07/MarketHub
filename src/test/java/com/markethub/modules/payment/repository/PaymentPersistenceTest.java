package com.markethub.modules.payment.repository;

import com.markethub.config.JpaAuditingConfig;
import com.markethub.modules.order.entity.Order;
import com.markethub.modules.order.entity.OrderStatus;
import com.markethub.modules.payment.entity.Payment;
import com.markethub.modules.payment.entity.PaymentMethod;
import com.markethub.modules.payment.entity.PaymentStatus;
import com.markethub.modules.payment.entity.ProcessedWebhookEvent;
import com.markethub.modules.user.entity.Role;
import com.markethub.modules.user.entity.User;
import com.markethub.modules.user.repository.UserRepository;
import com.markethub.modules.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@Import(JpaAuditingConfig.class)
class PaymentPersistenceTest {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProcessedWebhookEventRepository webhookEventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User user;
    private Order order;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.builder()
                .email("p@example.com").password("x").firstName("P").lastName("U")
                .role(Role.ROLE_CUSTOMER).build());
        order = orderRepository.save(Order.builder()
                .user(user).status(OrderStatus.CONFIRMED)
                .totalAmount(new BigDecimal("10.00")).build());
    }

    private Payment newPayment(String key) {
        return Payment.builder()
                .order(order).user(user).paymentMethod(PaymentMethod.CARD)
                .status(PaymentStatus.PENDING).amount(order.getTotalAmount())
                .currency("INR").paymentReference("PAY-" + System.nanoTime())
                .idempotencyKey(key).build();
    }

    @Test
    void webhookEvent_duplicateEventId_rejectedByDatabase() {
        webhookEventRepository.saveAndFlush(ProcessedWebhookEvent.builder().eventId("evt-1").status("CAPTURED").build());

        assertThrows(Exception.class, () ->
                webhookEventRepository.saveAndFlush(ProcessedWebhookEvent.builder().eventId("evt-1").status("CAPTURED").build()));
    }

    @Test
    void payment_duplicateUserIdempotencyKey_rejectedByDatabase() {
        paymentRepository.saveAndFlush(newPayment("key-1"));

        assertThrows(Exception.class, () -> paymentRepository.saveAndFlush(newPayment("key-1")));
    }

    @Test
    void payment_persistedWithAmountCurrencyAndReference() {
        Payment saved = paymentRepository.saveAndFlush(newPayment("key-2"));

        assertNotNull(saved.getId());
        org.junit.jupiter.api.Assertions.assertEquals(new BigDecimal("10.00"), saved.getAmount());
        org.junit.jupiter.api.Assertions.assertEquals("INR", saved.getCurrency());
        org.junit.jupiter.api.Assertions.assertEquals(PaymentStatus.PENDING, saved.getStatus());
        assertNotNull(saved.getPaymentReference());
    }
}
