package com.restaurant.management.bootstrap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.identity.repository.LoginHistoryRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import com.restaurant.management.ordering.repository.ServiceRequestRepository;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.util.Set;
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
class DevSupportApiIntegrationTest {

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
    private OrderRepository orderRepository;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TableSessionRepository tableSessionRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private LoginHistoryRepository loginHistoryRepository;

    @Test
    void shouldResetAndRebuildDeterministicScenarios() throws Exception {
        String accessToken = loginAsSeedAdmin();

        mockMvc.perform(post("/api/dev/scenarios/baseline")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("baseline"))
                .andExpect(jsonPath("$.tableCode").value("T-01"))
                .andExpect(jsonPath("$.qrToken").isNotEmpty())
                .andExpect(jsonPath("$.tableSessionId").doesNotExist())
                .andExpect(jsonPath("$.orderId").doesNotExist());

        mockMvc.perform(post("/api/dev/scenarios/draft-order")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("draft-order"))
                .andExpect(jsonPath("$.tableSessionId").isNumber())
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.orderCode").value(org.hamcrest.Matchers.startsWith("ORD-")));

        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(serviceRequestRepository.count()).isZero();
        assertThat(invoiceRepository.count()).isZero();
        assertThat(tableSessionRepository.count()).isEqualTo(1);

        mockMvc.perform(post("/api/dev/scenarios/pending-bill")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("pending-bill"))
                .andExpect(jsonPath("$.tableSessionId").isNumber())
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.serviceRequestId").isNumber())
                .andExpect(jsonPath("$.serviceRequestType").value("REQUEST_BILL"));

        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(serviceRequestRepository.count()).isEqualTo(1);
        assertThat(invoiceRepository.count()).isZero();
        assertThat(paymentRepository.count()).isZero();
        assertThat(tableSessionRepository.count()).isEqualTo(1);

        mockMvc.perform(post("/api/dev/scenarios/open-invoice")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("open-invoice"))
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.invoiceId").isNumber())
                .andExpect(jsonPath("$.invoiceNumber").value(org.hamcrest.Matchers.startsWith("INV-")))
                .andExpect(jsonPath("$.invoiceStatus").value("OPEN"))
                .andExpect(jsonPath("$.paymentId").doesNotExist());

        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(invoiceRepository.count()).isEqualTo(1);
        assertThat(paymentRepository.count()).isZero();

        mockMvc.perform(post("/api/dev/scenarios/payment-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("payment-history"))
                .andExpect(jsonPath("$.orderId").isNumber())
                .andExpect(jsonPath("$.invoiceId").isNumber())
                .andExpect(jsonPath("$.invoiceStatus").value("PAID"))
                .andExpect(jsonPath("$.paymentId").isNumber())
                .andExpect(jsonPath("$.paymentCode").value(org.hamcrest.Matchers.startsWith("PAY-")))
                .andExpect(jsonPath("$.paymentStatus").value("COMPLETED"));

        mockMvc.perform(post("/api/dev/scenarios/payment-history")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("payment-history"))
                .andExpect(jsonPath("$.invoiceStatus").value("PAID"))
                .andExpect(jsonPath("$.paymentStatus").value("COMPLETED"));

        assertThat(orderRepository.count()).isEqualTo(1);
        assertThat(invoiceRepository.count()).isEqualTo(1);
        assertThat(paymentRepository.count()).isEqualTo(1);

        mockMvc.perform(post("/api/dev/reset")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLEARED"));

        assertThat(orderRepository.count()).isZero();
        assertThat(serviceRequestRepository.count()).isZero();
        assertThat(invoiceRepository.count()).isZero();
        assertThat(paymentRepository.count()).isZero();
        assertThat(tableSessionRepository.count()).isZero();
        assertThat(reservationRepository.count()).isZero();
    }

    @Test
    void shouldRejectAnonymousCallsToDevSupportEndpoints() throws Exception {
        mockMvc.perform(post("/api/dev/scenarios/baseline"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldSeedWorkbookCompatibleRegressionUsersDuringBaselineScenario() throws Exception {
        String accessToken = loginAsSeedAdmin();

        mockMvc.perform(post("/api/dev/scenarios/baseline")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk());

        assertThat(userAccountRepository.existsByUsernameIgnoreCase("admin01")).isTrue();
        assertThat(userAccountRepository.existsByUsernameIgnoreCase("manager01")).isTrue();
        assertThat(userAccountRepository.existsByUsernameIgnoreCase("waiter01")).isTrue();
        assertThat(userAccountRepository.existsByUsernameIgnoreCase("cashier01")).isTrue();

        login("admin01", "Admin@123");
        login("manager01", "Manager@123");
        login("waiter01", "Waiter@123");
        login("cashier01", "Cashier@123");

        assertThat(loginHistoryRepository.findAll().stream().map(history -> history.getUsernameSnapshot()).collect(java.util.stream.Collectors.toSet()))
                .containsAll(Set.of("admin01", "manager01", "waiter01", "cashier01"));
    }

    private String loginAsSeedAdmin() throws Exception {
        return login("admin", "Admin@123456").path("accessToken").asText();
    }

    private JsonNode login(String username, String password) throws Exception {
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

        return objectMapper.readTree(loginResult.getResponse().getContentAsString());
    }
}
