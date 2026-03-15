package com.restaurant.management.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MenuItemRequest(
        @NotBlank String code,
        @NotBlank String name,
        String description,
        @NotNull @DecimalMin("0.00") BigDecimal price,
        boolean available,
        boolean active,
        @NotNull Long categoryId
) {
}
