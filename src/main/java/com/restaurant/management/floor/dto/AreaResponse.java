package com.restaurant.management.floor.dto;

public record AreaResponse(
        Long id,
        String code,
        String name,
        String description,
        boolean active
) {
}
