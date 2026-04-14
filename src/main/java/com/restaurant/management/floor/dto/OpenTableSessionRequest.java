package com.restaurant.management.floor.dto;

import jakarta.validation.constraints.NotNull;

public record OpenTableSessionRequest(@NotNull Long diningTableId) {
}
