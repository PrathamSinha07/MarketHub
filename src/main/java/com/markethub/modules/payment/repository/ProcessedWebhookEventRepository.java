package com.markethub.modules.payment.repository;

import com.markethub.modules.payment.entity.ProcessedWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessedWebhookEventRepository extends JpaRepository<ProcessedWebhookEvent, Long> {

    boolean existsByEventId(String eventId);

    Optional<ProcessedWebhookEvent> findByEventId(String eventId);
}
