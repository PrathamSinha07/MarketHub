package com.markethub.modules.payment.entity;

import com.markethub.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "processed_webhook_events",
        indexes = {
                @Index(name = "idx_webhook_events_event_id", columnList = "event_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_webhook_events_event_id", columnNames = "event_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessedWebhookEvent extends BaseEntity {

    @Column(name = "event_id", nullable = false, updatable = false)
    private String eventId;

    @Column(name = "gateway_reference_id")
    private String gatewayReferenceId;

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "status")
    private String status;
}
