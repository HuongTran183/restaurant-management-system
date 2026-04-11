package com.restaurant.management.reservation.dto;

import java.util.List;

public record PublicBookingAreaResponse(
        Long id,
        String code,
        String name,
        String description,
        int totalTables,
        int availableTables,
        int bookedTables,
        List<PublicBookingTableResponse> tables
) {
}
