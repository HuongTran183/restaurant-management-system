package com.restaurant.management.ordering.dto;

import jakarta.validation.constraints.Min;

public record UpdateOrderItemRequest(
        @Min(1) Integer quantity,
        String note,
        boolean cancelled
) {
}
