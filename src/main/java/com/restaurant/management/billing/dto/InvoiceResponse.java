package com.restaurant.management.billing.dto;

import com.restaurant.management.billing.domain.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String invoiceNumber,
        Long orderId,
        InvoiceStatus status,
        BigDecimal subtotal,
        BigDecimal serviceFee,
        BigDecimal vatAmount,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        Instant issuedAt,
        Instant closedAt,
        List<InvoiceItemResponse> items,
        List<PaymentResponse> payments
) {
}
