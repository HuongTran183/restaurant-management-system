package com.restaurant.management.floor.dto;

import jakarta.validation.constraints.NotBlank;

public record AreaRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        boolean active
) {
}
