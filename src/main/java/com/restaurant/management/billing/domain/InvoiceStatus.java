package com.restaurant.management.billing.domain;

public enum InvoiceStatus {
    OPEN,
    PAID,
    VOID;

    public boolean isOpen() {
        return this == OPEN;
    }
}
