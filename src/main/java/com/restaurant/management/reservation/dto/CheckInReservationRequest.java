package com.restaurant.management.reservation.dto;

import jakarta.validation.constraints.NotNull;

public record CheckInReservationRequest(
        @NotNull Long diningTableId,
        String internalNote
) {
}
