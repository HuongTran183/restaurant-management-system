package com.restaurant.management.floor.dto;

import com.restaurant.management.floor.domain.TableStatus;

public record DiningTableResponse(
        Long id,
        String code,
        String name,
        int seatCount,
        TableStatus status,
        boolean active,
        Long areaId,
        String areaName
) {
}
