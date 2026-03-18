package com.restaurant.management.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CustomerRequest(
        @NotBlank String fullName,
        @NotBlank String phone,
        @Email String email,
        boolean active
) {
}
