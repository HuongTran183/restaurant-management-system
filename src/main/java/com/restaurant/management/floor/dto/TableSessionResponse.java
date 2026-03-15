package com.restaurant.management.floor.dto;

import com.restaurant.management.floor.domain.TableSessionStatus;
import java.time.Instant;

public record TableSessionResponse(
        Long id,
        String sessionCode,
        Long diningTableId,
        String tableCode,
        String tableName,
        TableSessionStatus status,
        Instant openedAt,
        Instant closedAt
) {
}
