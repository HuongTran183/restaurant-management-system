package com.restaurant.management.identity.controller;

import com.restaurant.management.identity.dto.AuthTokenResponse;
import com.restaurant.management.identity.dto.LoginRequest;
import com.restaurant.management.identity.dto.LogoutRequest;
import com.restaurant.management.identity.dto.RefreshTokenRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
        return authenticationService.login(request, httpServletRequest.getRemoteAddr());
    }

    @PostMapping("/refresh")
    public AuthTokenResponse refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpServletRequest
    ) {
        return authenticationService.refresh(request, httpServletRequest.getRemoteAddr());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authenticationService.logout(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal Object principal) {
        return authenticationService.me(principal);
    }
}
