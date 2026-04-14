package com.restaurant.management.floor.dto;

import java.time.Instant;

public record PublicTableQrResponse(
        String token,
        String label,
        String landingUrl,
        Instant expiresAt
) {
}
