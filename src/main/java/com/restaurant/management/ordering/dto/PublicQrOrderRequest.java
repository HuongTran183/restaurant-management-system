package com.restaurant.management.ordering.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record PublicQrOrderRequest(
        String note,
        @NotEmpty List<@Valid AddOrderItemRequest> items
) {
}
