package com.restaurant.management.billing.dto;

import jakarta.validation.constraints.NotNull;

public record CreateInvoiceRequest(@NotNull Long orderId) {
}
