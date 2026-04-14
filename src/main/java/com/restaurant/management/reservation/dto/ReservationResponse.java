package com.restaurant.management.reservation.dto;

import com.restaurant.management.reservation.domain.ReservationStatus;
import java.time.Instant;

public record ReservationResponse(
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
        String internalNote,
        Instant confirmedAt,
        Instant cancelledAt,
        Instant checkedInAt,
        Instant completedAt
) {
}
