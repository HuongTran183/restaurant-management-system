package com.restaurant.management.floor.dto;

import com.restaurant.management.floor.domain.TableStatus;
import java.time.Instant;

public record PublicQrTableResponse(
        Long tableId,
        String tableCode,
        String tableName,
        String areaName,
        TableStatus tableStatus,
        Long openTableSessionId,
        String qrToken,
        boolean qrActive,
        Instant qrExpiresAt
) {
}
