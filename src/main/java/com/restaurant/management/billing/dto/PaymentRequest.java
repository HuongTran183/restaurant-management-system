package com.restaurant.management.billing.dto;

import com.restaurant.management.billing.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull Long invoiceId,
        @NotNull PaymentMethod method,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String note
) {
}
