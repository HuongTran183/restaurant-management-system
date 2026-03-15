package com.restaurant.management.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.ServletException;
import java.io.IOException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

class JwtAuthenticationFilterTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldNotAuthenticateDisabledUsers() throws ServletException, IOException {
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);
        ApplicationUserDetailsService userDetailsService = mock(ApplicationUserDetailsService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtTokenService, userDetailsService);

        when(jwtTokenService.extractUsername("valid-token")).thenReturn("admin");
        when(jwtTokenService.isTokenValid("valid-token", "admin")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("admin")).thenReturn(
                User.withUsername("admin")
                        .password("ignored")
                        .disabled(true)
                        .roles("ADMIN")
                        .build()
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}
