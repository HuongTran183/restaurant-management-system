package com.restaurant.management.ordering.domain;

public enum OrderStatus {
    DRAFT,
    CONFIRMED,
    COMPLETED,
    CANCELLED;

    public boolean canEditItems() {
        return this == DRAFT;
    }

    public boolean canConfirm() {
        return this == DRAFT;
    }

    public boolean canCancel() {
        return this == DRAFT || this == CONFIRMED;
    }

    public boolean canComplete() {
        return this == CONFIRMED;
    }

    public boolean isFinalState() {
        return this == COMPLETED || this == CANCELLED;
    }
}
