package com.restaurant.management.reservation.dto;

import java.util.List;

public record PublicReservationSearchResponse(
        String matchMode,
        List<PublicReservationResponse> reservations
) {
}
