package com.restaurant.management.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JwtTokenServiceTest {

    @Test
    void shouldIssueAndValidateAccessToken() {
        AppJwtProperties properties = new AppJwtProperties();
        properties.setIssuer("restaurant-management-system");
        properties.setAccessTokenMinutes(30);
        properties.setRefreshTokenDays(14);
        properties.setSecret("change-me-change-me-change-me-change-me-change-me-change-me");

        JwtTokenService service = new JwtTokenService(properties);
        AuthenticatedUser user = new AuthenticatedUserFixture().create();

        JwtTokenService.IssuedAccessToken token = service.issueAccessToken(user);

        assertThat(token.token()).isNotBlank();
        assertThat(service.extractUsername(token.token())).isEqualTo(user.getUsername());
        assertThat(service.isTokenValid(token.token(), user.getUsername())).isTrue();
        assertThat(token.expiresAt()).isAfter(java.time.Instant.now());
    }

    private static class AuthenticatedUserFixture {
        AuthenticatedUser create() {
            com.restaurant.management.identity.domain.UserAccount user = new com.restaurant.management.identity.domain.UserAccount();
            user.setUsername("admin");
            user.setPasswordHash("secret");
            user.setFullName("System Admin");
            user.setEmail("admin@restaurant.local");
            user.setActive(true);

            com.restaurant.management.identity.domain.Role role = new com.restaurant.management.identity.domain.Role();
            role.setCode(com.restaurant.management.identity.domain.RoleCode.ADMIN);
            role.setName("ADMIN");
            user.setRoles(java.util.Set.of(role));
            return AuthenticatedUser.from(user);
        }
    }
}
