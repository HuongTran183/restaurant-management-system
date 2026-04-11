package com.restaurant.management.identity.controller;

import com.restaurant.management.identity.dto.AuthTokenResponse;
import com.restaurant.management.identity.dto.PublicRegistrationRequest;
import com.restaurant.management.identity.dto.StaffRegistrationRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.service.PublicRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
public class PublicAuthController {

    private final PublicRegistrationService registrationService;

    public PublicAuthController(PublicRegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /**
     * Register a new customer account.
     * Customers are automatically activated and can login immediately.
     */
    @PostMapping("/register/customer")
    public AuthTokenResponse registerCustomer(
            @Valid @RequestBody PublicRegistrationRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return registrationService.registerCustomer(request, httpServletRequest.getRemoteAddr());
    }

    /**
     * Register a new staff account.
     * Staff accounts are created as inactive and need admin approval before they can login.
     */
    @PostMapping("/register/staff")
    public UserProfileResponse registerStaff(@Valid @RequestBody StaffRegistrationRequest request) {
        return registrationService.registerStaff(request);
    }
}
