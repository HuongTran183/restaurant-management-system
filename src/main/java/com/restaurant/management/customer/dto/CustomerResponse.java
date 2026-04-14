package com.restaurant.management.customer.dto;

public record CustomerResponse(
        Long id,
        String code,
        String fullName,
        String phone,
        String email,
        boolean active
) {
}
