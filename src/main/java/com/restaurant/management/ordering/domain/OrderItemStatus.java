package com.restaurant.management.ordering.domain;

public enum OrderItemStatus {
    NEW,
    CONFIRMED,
    CANCELLED;

    public boolean isBillable() {
        return this != CANCELLED;
    }
}
