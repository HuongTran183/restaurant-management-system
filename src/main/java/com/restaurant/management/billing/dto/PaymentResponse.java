package com.restaurant.management.billing.dto;

import com.restaurant.management.billing.domain.PaymentMethod;
import com.restaurant.management.billing.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        String paymentCode,
        Long invoiceId,
        PaymentMethod method,
        PaymentStatus status,
        BigDecimal amount,
        Instant paidAt,
        String note
) {
}
