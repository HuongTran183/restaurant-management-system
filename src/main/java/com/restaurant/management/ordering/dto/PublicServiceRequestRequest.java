package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.ServiceRequestType;
import jakarta.validation.constraints.NotNull;

public record PublicServiceRequestRequest(
        String orderCode,
        @NotNull ServiceRequestType requestType,
        String note
) {
}
