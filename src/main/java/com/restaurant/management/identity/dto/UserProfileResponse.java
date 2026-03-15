package com.restaurant.management.identity.dto;

import java.util.Set;

public record UserProfileResponse(
        Long id,
        String username,
        String fullName,
        String email,
        boolean active,
        Set<String> roles
) {
}
