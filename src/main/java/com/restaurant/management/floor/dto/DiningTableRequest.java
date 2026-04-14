package com.restaurant.management.floor.dto;

import com.restaurant.management.floor.domain.TableStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DiningTableRequest(
        @NotBlank String code,
        @NotBlank String name,
        @Min(1) int seatCount,
        @NotNull TableStatus status,
        boolean active,
        @NotNull Long areaId
) {
}
