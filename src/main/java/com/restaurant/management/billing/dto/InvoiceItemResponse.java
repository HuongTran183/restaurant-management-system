package com.restaurant.management.billing.dto;

import java.math.BigDecimal;

public record InvoiceItemResponse(
        Long id,
        Long orderItemId,
        String itemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
