package com.restaurant.management.reservation.dto;

import jakarta.validation.constraints.NotBlank;

public record PublicReservationSearchRequest(
        @NotBlank String query
) {
}
