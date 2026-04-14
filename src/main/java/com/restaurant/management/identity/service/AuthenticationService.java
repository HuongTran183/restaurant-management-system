package com.restaurant.management.identity.service;

import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.security.AppJwtProperties;
import com.restaurant.management.common.security.AuthenticatedUser;
import com.restaurant.management.common.security.JwtTokenService;
import com.restaurant.management.identity.domain.LoginHistory;
import com.restaurant.management.identity.domain.RefreshToken;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.dto.AuthTokenResponse;
import com.restaurant.management.identity.dto.LoginRequest;
import com.restaurant.management.identity.dto.LogoutRequest;
import com.restaurant.management.identity.dto.RefreshTokenRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.repository.LoginHistoryRepository;
import com.restaurant.management.identity.repository.RefreshTokenRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final AppJwtProperties jwtProperties;
    private final AuditLogService auditLogService;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthenticationService(
            UserAccountRepository userAccountRepository,
            RefreshTokenRepository refreshTokenRepository,
            LoginHistoryRepository loginHistoryRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            AppJwtProperties jwtProperties,
            AuditLogService auditLogService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.loginHistoryRepository = loginHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.jwtProperties = jwtProperties;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request, String ipAddress) {
        UserAccount userAccount = userAccountRepository.findByUsernameIgnoreCase(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!userAccount.isActive() || !passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(userAccount);
        JwtTokenService.IssuedAccessToken accessToken = jwtTokenService.issueAccessToken(authenticatedUser);
        String sessionId = nextOpaqueToken(18);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserAccount(userAccount);
        refreshToken.setToken(nextOpaqueToken(48));
        refreshToken.setSessionId(sessionId);
        refreshToken.setIssuedFromIp(ipAddress);
        refreshToken.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        LoginHistory loginHistory = new LoginHistory();
        loginHistory.setUserAccount(userAccount);
        loginHistory.setSessionId(sessionId);
        loginHistory.setUsernameSnapshot(userAccount.getUsername());
        loginHistory.setIpAddress(ipAddress);
        loginHistory.setLoginAt(Instant.now());
        loginHistoryRepository.save(loginHistory);

        auditLogService.recordSystem("AUTH_LOGIN", "USER", userAccount.getId().toString(), userAccount.getUsername());
        return new AuthTokenResponse(accessToken.token(), refreshToken.getToken(), accessToken.expiresAt(), toProfile(userAccount));
    }

    @Transactional
    public AuthTokenResponse refresh(RefreshTokenRequest request, String ipAddress) {
        RefreshToken existingToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new BadCredentialsException("Refresh token is invalid"));
        if (!existingToken.isActive()) {
            throw new BadCredentialsException("Refresh token is expired or revoked");
        }

        UserAccount userAccount = existingToken.getUserAccount();
        if (!userAccount.isActive()) {
            existingToken.setRevokedAt(Instant.now());
            throw new BadCredentialsException("User account is inactive");
        }

        existingToken.setRevokedAt(Instant.now());
        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(userAccount);
        JwtTokenService.IssuedAccessToken accessToken = jwtTokenService.issueAccessToken(authenticatedUser);

        RefreshToken rotatedToken = new RefreshToken();
        rotatedToken.setUserAccount(userAccount);
        rotatedToken.setToken(nextOpaqueToken(48));
        rotatedToken.setSessionId(existingToken.getSessionId());
        rotatedToken.setIssuedFromIp(ipAddress);
        rotatedToken.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(rotatedToken);

        auditLogService.recordSystem("AUTH_REFRESH", "USER", userAccount.getId().toString(), userAccount.getUsername());
        return new AuthTokenResponse(accessToken.token(), rotatedToken.getToken(), accessToken.expiresAt(), toProfile(userAccount));
    }

    @Transactional
    public void logout(LogoutRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token not found"));
        refreshToken.setRevokedAt(Instant.now());
        loginHistoryRepository.findFirstBySessionIdOrderByIdDesc(refreshToken.getSessionId())
                .ifPresent(history -> history.setLogoutAt(Instant.now()));
        auditLogService.recordSystem(
                "AUTH_LOGOUT",
                "USER",
                refreshToken.getUserAccount().getId().toString(),
                refreshToken.getUserAccount().getUsername()
        );
    }

    public UserProfileResponse me(Object principal) {
        if (!(principal instanceof AuthenticatedUser authenticatedUser)) {
            throw new BadCredentialsException("No authenticated user");
        }
        UserAccount userAccount = userAccountRepository.findById(authenticatedUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toProfile(userAccount);
    }

    public UserProfileResponse toProfile(UserAccount userAccount) {
        Set<String> roles = new LinkedHashSet<>();
        userAccount.getRoles().forEach(role -> roles.add(role.getCode().name()));
        return new UserProfileResponse(
                userAccount.getId(),
                userAccount.getUsername(),
                userAccount.getFullName(),
                userAccount.getEmail(),
                userAccount.isActive(),
                roles
        );
    }

    private String nextOpaqueToken(int byteLength) {
        byte[] buffer = new byte[byteLength];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }
}
