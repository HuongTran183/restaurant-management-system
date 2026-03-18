package com.restaurant.management.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record ReservationRequest(
        @NotBlank String customerName,
        @NotBlank String phone,
        @Email String email,
        @Min(1) int partySize,
        @NotNull @Future Instant reservationTime,
        String requestedArea,
        String note
) {
}
