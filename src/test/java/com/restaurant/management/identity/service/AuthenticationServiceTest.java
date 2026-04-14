package com.restaurant.management.identity.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurant.management.common.security.AppJwtProperties;
import com.restaurant.management.common.security.JwtTokenService;
import com.restaurant.management.identity.domain.RefreshToken;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.dto.RefreshTokenRequest;
import com.restaurant.management.identity.repository.LoginHistoryRepository;
import com.restaurant.management.identity.repository.RefreshTokenRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthenticationServiceTest {

    @Test
    void shouldRejectRefreshTokenForInactiveUser() {
        UserAccountRepository userAccountRepository = mock(UserAccountRepository.class);
        RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
        LoginHistoryRepository loginHistoryRepository = mock(LoginHistoryRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);

        AppJwtProperties properties = new AppJwtProperties();
        properties.setIssuer("restaurant-management-system");
        properties.setAccessTokenMinutes(30);
        properties.setRefreshTokenDays(14);
        properties.setSecret("change-me-change-me-change-me-change-me-change-me-change-me");

        AuthenticationService service = new AuthenticationService(
                userAccountRepository,
                refreshTokenRepository,
                loginHistoryRepository,
                passwordEncoder,
                jwtTokenService,
                properties,
                auditLogService
        );

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername("disabled-user");
        userAccount.setPasswordHash("secret");
        userAccount.setFullName("Disabled User");
        userAccount.setEmail("disabled@restaurant.local");
        userAccount.setActive(false);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        refreshToken.setSessionId("session-1");
        refreshToken.setUserAccount(userAccount);
        refreshToken.setExpiresAt(Instant.now().plus(1, ChronoUnit.DAYS));

        when(refreshTokenRepository.findByToken("refresh-token")).thenReturn(Optional.of(refreshToken));

        assertThatThrownBy(() -> service.refresh(new RefreshTokenRequest("refresh-token"), "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("User account is inactive");

        assertThat(refreshToken.getRevokedAt()).isNotNull();
        verify(refreshTokenRepository, never()).save(any(RefreshToken.class));
        verify(auditLogService, never()).recordSystem(any(), any(), any(), any());
    }
}
