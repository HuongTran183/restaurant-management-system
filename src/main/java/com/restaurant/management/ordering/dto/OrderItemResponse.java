package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.OrderItemStatus;
import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long menuItemId,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal,
        String note,
        OrderItemStatus status
) {
}
