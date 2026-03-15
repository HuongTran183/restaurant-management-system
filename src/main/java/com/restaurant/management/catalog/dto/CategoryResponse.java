package com.restaurant.management.catalog.dto;

public record CategoryResponse(
        Long id,
        String code,
        String name,
        String description,
        int sortOrder,
        boolean active
) {
}
