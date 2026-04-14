package com.restaurant.management.reservation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record PublicReservationRescheduleRequest(
        @NotBlank String phone,
        @NotNull @Future Instant reservationTime
) {
}
