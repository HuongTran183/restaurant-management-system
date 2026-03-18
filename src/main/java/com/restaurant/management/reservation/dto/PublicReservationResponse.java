package com.restaurant.management.reservation.dto;

import com.restaurant.management.reservation.domain.ReservationStatus;
import java.time.Instant;

public record PublicReservationResponse(
        Long id,
        String reservationCode,
        String customerName,
        String phone,
        String email,
        int partySize,
        Instant reservationTime,
        ReservationStatus status,
        String requestedArea,
        Long assignedTableId,
        String assignedTableCode,
        String assignedTableName,
        String note,
        Instant confirmedAt,
        Instant cancelledAt,
        Instant checkedInAt,
        Instant completedAt
) {
}
