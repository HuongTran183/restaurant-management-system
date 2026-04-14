package com.restaurant.management.catalog.dto;

import java.time.Instant;

public record CategoryResponse(
        Long id,
        String code,
        String name,
        String description,
        int sortOrder,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
