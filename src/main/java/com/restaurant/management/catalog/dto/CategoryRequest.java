package com.restaurant.management.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record CategoryRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        @PositiveOrZero int sortOrder,
        boolean active
) {
}
