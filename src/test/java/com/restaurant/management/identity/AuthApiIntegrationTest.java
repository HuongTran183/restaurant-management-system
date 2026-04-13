package com.restaurant.management.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.management.identity.domain.LoginHistory;
import com.restaurant.management.identity.repository.LoginHistoryRepository;
import java.util.Comparator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
@TestPropertySource(properties = {
        "app.security.seed-admin.username=admin",
        "app.security.seed-admin.password=Admin@123456",
        "app.security.seed-admin.email=admin@restaurant.local",
        "app.security.seed-admin.full-name=System Administrator"
})
class AuthApiIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("restaurant_management_test")
            .withUsername("restaurant")
            .withPassword("restaurant");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Test
    void shouldLoginWithSeededAdminAccount() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"admin\",
                                  \"password\": \"Admin@123456\"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("admin"));
    }

    @Test
    void shouldRejectInvalidPassword() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"admin\",
                                  \"password\": \"WrongPassword@123\"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnknownUsername() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"missing-user\",
                                  \"password\": \"Admin@123456\"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectBlankCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"\",
                                  \"password\": \"\"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldWriteLogoutTimestampForLatestSession() throws Exception {
        JsonNode loginPayload = login("admin", "Admin@123456");
        LoginHistory latestHistory = loginHistoryRepository.findAll().stream()
                .max(Comparator.comparing(LoginHistory::getId))
                .orElseThrow();

        mockMvc.perform(post("/api/auth/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginPayload.path("accessToken").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"refreshToken\": \"%s\"
                                }
                                """.formatted(loginPayload.path("refreshToken").asText())))
                .andExpect(status().isOk());

        LoginHistory updatedHistory = loginHistoryRepository.findById(latestHistory.getId()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(updatedHistory.getLogoutAt()).isNotNull();
    }

    private JsonNode login(String username, String password) throws Exception {
        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"%s\",
                                  \"password\": \"%s\"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(responseBody);
    }
}

