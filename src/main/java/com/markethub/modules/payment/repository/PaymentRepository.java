package com.markethub.modules.payment.repository;

import com.markethub.modules.payment.entity.Payment;
import com.markethub.modules.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);

    List<Payment> findByUserId(Long userId);

    boolean existsByOrderIdAndStatusIn(Long orderId, Collection<PaymentStatus> statuses);
}
