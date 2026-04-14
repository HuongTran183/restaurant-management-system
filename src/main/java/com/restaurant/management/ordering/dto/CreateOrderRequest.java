package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.OrderType;
import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
        @NotNull OrderType orderType,
        Long tableSessionId,
        Long customerId,
        String note
) {
}
