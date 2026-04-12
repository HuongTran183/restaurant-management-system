package com.restaurant.management.common.websocket;

import java.time.Instant;

public record WebSocketEvent(
        String type,
        Long entityId,
        String entityCode,
        Instant timestamp,
        Object data
) {
    public static WebSocketEvent of(String type, Long entityId, String entityCode) {
        return new WebSocketEvent(type, entityId, entityCode, Instant.now(), null);
    }

    public static WebSocketEvent of(String type, Long entityId, String entityCode, Object data) {
        return new WebSocketEvent(type, entityId, entityCode, Instant.now(), data);
    }
}
