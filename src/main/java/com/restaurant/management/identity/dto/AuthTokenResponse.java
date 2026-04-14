package com.restaurant.management.identity.dto;

import java.time.Instant;

public record AuthTokenResponse(
        String accessToken,
        String refreshToken,
        Instant accessTokenExpiresAt,
        UserProfileResponse user
) {
}
