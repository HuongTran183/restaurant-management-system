package com.restaurant.management.reservation.dto;

public record PublicBookingTableResponse(
        Long id,
        String code,
        String name,
        int seatCount,
        Long areaId,
        String areaName,
        String bookingStatus,
        boolean selectable
) {
}
