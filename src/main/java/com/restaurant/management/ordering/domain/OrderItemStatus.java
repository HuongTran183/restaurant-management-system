package com.restaurant.management.ordering.domain;

public enum OrderItemStatus {
    NEW,
    CONFIRMED,
    PREPARING,
    READY,
    SERVED,
    CANCELLED;

    public boolean isBillable() {
        return this != CANCELLED;
    }

    public boolean isKitchenActive() {
        return this == CONFIRMED || this == PREPARING;
    }
}
