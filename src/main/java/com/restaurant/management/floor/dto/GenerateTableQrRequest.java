package com.restaurant.management.floor.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record GenerateTableQrRequest(
        @NotNull Long diningTableId,
        String label,
        Instant expiresAt
) {
}
