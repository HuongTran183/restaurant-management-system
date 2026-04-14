package com.restaurant.management.identity.dto;

import com.restaurant.management.identity.domain.RoleCode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record CreateUserRequest(
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String fullName,
        @Email String email,
        @NotEmpty Set<RoleCode> roles
) {
}
