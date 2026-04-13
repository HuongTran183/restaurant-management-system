package com.restaurant.management.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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
class RoleAccessApiIntegrationTest {

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

    @Test
    void shouldSeedWorkbookUsersAndApplyRoleAwareEndpointRestrictions() throws Exception {
        String bootstrapAdminToken = login("admin", "Admin@123456");
        mockMvc.perform(post("/api/dev/scenarios/baseline")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bootstrapAdminToken))
                .andExpect(status().isOk());

        String adminWorkbookToken = login("admin01", "Admin@123");
        String managerToken = login("manager01", "Manager@123");
        String waiterToken = login("waiter01", "Waiter@123");
        String cashierToken = login("cashier01", "Cashier@123");

        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminWorkbookToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + managerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + waiterToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/tables")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + waiterToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/tables")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/payments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + cashierToken))
                .andExpect(status().isOk());
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"%s\",
                                  \"password\": \"%s\"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return loginJson.path("accessToken").asText();
    }
}
