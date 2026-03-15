package com.restaurant.management.ordering.dto;

import com.restaurant.management.ordering.domain.ServiceRequestStatus;
import com.restaurant.management.ordering.domain.ServiceRequestType;
import java.time.Instant;

public record ServiceRequestResponse(
        Long id,
        Long tableSessionId,
        Long orderId,
        ServiceRequestType requestType,
        String note,
        ServiceRequestStatus status,
        Instant requestedAt,
        Instant resolvedAt
) {
}
