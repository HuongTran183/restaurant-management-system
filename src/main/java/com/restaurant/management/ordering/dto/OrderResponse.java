package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderType;
import java.math.BigDecimal;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderCode,
        Long tableSessionId,
        Long customerId,
        OrderType orderType,
        OrderStatus status,
        BigDecimal subtotal,
        BigDecimal serviceFee,
        BigDecimal vatAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        boolean paymentRequested,
        String note,
        List<OrderItemResponse> items
) {
}
