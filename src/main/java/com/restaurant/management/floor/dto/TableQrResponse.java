package com.restaurant.management.floor.dto;

import java.time.Instant;

public record TableQrResponse(
        Long id,
        Long diningTableId,
        String diningTableCode,
        String token,
        String label,
        String landingUrl,
        String imagePath,
        Instant expiresAt,
        boolean active
) {
}
