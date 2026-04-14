package com.restaurant.management.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
@ExtendWith(OutputCaptureExtension.class)
@TestPropertySource(properties = "app.diagnostics.slow-request-threshold-ms=0")
class PublicMenuSlowDiagnosticsIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("restaurant_management_test")
            .withUsername("restaurant")
            .withPassword("restaurant");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MeterRegistry meterRegistry;

    @Test
    void shouldRecordSlowRequestSignalWhenThresholdIsExceeded(CapturedOutput output) throws Exception {
        mockMvc.perform(get("/api/public/menu")
                        .header("X-Correlation-Id", "diag-menu-slow-1"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", "diag-menu-slow-1"));

        assertThat(output.getOut()).contains("Public API request slow/failing: correlationId=diag-menu-slow-1");
        assertThat(meterRegistry.get("app.public.api.slow_requests")
                .tag("endpoint", "menu")
                .tag("method", "GET")
                .tag("status", "2xx")
                .counter()
                .count()).isGreaterThanOrEqualTo(1);
    }
}
