package com.markethub.modules.payment.entity;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    FAILED,
    CANCELLED,
    REFUNDED;

    private static final Map<PaymentStatus, Set<PaymentStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(PaymentStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(PENDING, EnumSet.of(AUTHORIZED, CAPTURED, FAILED, CANCELLED));
        ALLOWED_TRANSITIONS.put(AUTHORIZED, EnumSet.of(CAPTURED, FAILED, CANCELLED));
        ALLOWED_TRANSITIONS.put(CAPTURED, EnumSet.of(REFUNDED));
        ALLOWED_TRANSITIONS.put(FAILED, EnumSet.noneOf(PaymentStatus.class));
        ALLOWED_TRANSITIONS.put(CANCELLED, EnumSet.noneOf(PaymentStatus.class));
        ALLOWED_TRANSITIONS.put(REFUNDED, EnumSet.noneOf(PaymentStatus.class));
    }

    public boolean canTransitionTo(PaymentStatus next) {
        if (next == null) {
            return false;
        }
        return ALLOWED_TRANSITIONS.getOrDefault(this, EnumSet.noneOf(PaymentStatus.class)).contains(next);
    }
}
