package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.OrderItemStatus;
import java.time.Instant;

public record KitchenItemResponse(
        Long id,
        Long orderId,
        String orderCode,
        Long tableSessionId,
        Long menuItemId,
        String itemName,
        int quantity,
        String note,
        OrderItemStatus status,
        Instant createdAt
) {
}
