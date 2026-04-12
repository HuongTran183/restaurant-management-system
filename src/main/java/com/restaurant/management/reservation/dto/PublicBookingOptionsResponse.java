package com.restaurant.management.reservation.dto;

import java.time.Instant;
import java.util.List;

public record PublicBookingOptionsResponse(
        Instant reservationTime,
        int partySize,
        List<PublicBookingAreaResponse> areas
) {
}
