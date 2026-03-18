package com.restaurant.management.reservation;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import java.time.Instant;
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
class ReservationApiIntegrationTest {

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
    private AreaRepository areaRepository;

    @Autowired
    private DiningTableRepository diningTableRepository;

    @Test
    void shouldCreateConfirmAndCheckInReservationAcrossPublicAndStaffApis() throws Exception {
        DiningTable diningTable = seedDiningTable();
        String reservationTime = Instant.now().plusSeconds(7_200).toString();

        MvcResult createReservationResult = mockMvc.perform(post("/api/public/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"customerName\": \"Nguyen Van A\",
                                  \"phone\": \"0901234567\",
                                  \"email\": \"guest@example.com\",
                                  \"partySize\": 4,
                                  \"reservationTime\": \"%s\",
                                  \"requestedArea\": \"Main hall\",
                                  \"note\": \"Birthday dinner\"
                                }
                                """.formatted(reservationTime)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.reservationCode").isNotEmpty())
                .andExpect(jsonPath("$.internalNote").doesNotExist())
                .andReturn();

        JsonNode createReservationJson = objectMapper.readTree(createReservationResult.getResponse().getContentAsString());
        long reservationId = createReservationJson.path("id").asLong();
        String reservationCode = createReservationJson.path("reservationCode").asText();
        String accessToken = loginAsSeedAdmin();

        mockMvc.perform(post("/api/reservations/{reservationId}/confirm", reservationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"internalNote\": \"Confirmed by phone\"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmedAt").isNotEmpty());

        mockMvc.perform(post("/api/reservations/{reservationId}/check-in", reservationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"diningTableId\": %d,
                                  \"internalNote\": \"Guest already arrived\"
                                }
                                """.formatted(diningTable.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.assignedTableId").value(diningTable.getId()))
                .andExpect(jsonPath("$.assignedTableCode").value(diningTable.getCode()))
                .andExpect(jsonPath("$.checkedInAt").isNotEmpty());

        mockMvc.perform(get("/api/public/reservations/{reservationCode}", reservationCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationCode").value(reservationCode))
                .andExpect(jsonPath("$.status").value("CHECKED_IN"))
                .andExpect(jsonPath("$.assignedTableCode").value(diningTable.getCode()))
                .andExpect(jsonPath("$.internalNote").doesNotExist());

        mockMvc.perform(post("/api/public/reservations/{reservationCode}/cancel", reservationCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"note\": \"Guest changed plans after arrival\"
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldKeepInternalNotesPrivateWhenGuestCancelsReservation() throws Exception {
        String reservationTime = Instant.now().plusSeconds(5_400).toString();

        MvcResult createReservationResult = mockMvc.perform(post("/api/public/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"customerName\": \"Tran Thi B\",
                                  \"phone\": \"0902222333\",
                                  \"partySize\": 2,
                                  \"reservationTime\": \"%s\",
                                  \"requestedArea\": \"Patio\",
                                  \"note\": \"Window seat if possible\"
                                }
                                """.formatted(reservationTime)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.internalNote").doesNotExist())
                .andReturn();

        JsonNode createReservationJson = objectMapper.readTree(createReservationResult.getResponse().getContentAsString());
        long reservationId = createReservationJson.path("id").asLong();
        String reservationCode = createReservationJson.path("reservationCode").asText();
        String accessToken = loginAsSeedAdmin();

        mockMvc.perform(post("/api/reservations/{reservationId}/confirm", reservationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"internalNote\": \"VIP guest\"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.internalNote").value("VIP guest"));

        mockMvc.perform(post("/api/public/reservations/{reservationCode}/cancel", reservationCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"note\": \"Running late, please cancel\"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.internalNote").doesNotExist());

        mockMvc.perform(get("/api/reservations/{reservationId}", reservationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.internalNote").value("VIP guest"));
    }

    private String loginAsSeedAdmin() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  \"username\": \"admin\",
                                  \"password\": \"Admin@123456\"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return loginJson.path("accessToken").asText();
    }

    private DiningTable seedDiningTable() {
        String suffix = String.valueOf(System.nanoTime());

        Area area = new Area();
        area.setCode("AREA-" + suffix);
        area.setName("Reservation Area " + suffix);
        area.setDescription("Reservation integration test area");
        area.setActive(true);
        area = areaRepository.save(area);

        DiningTable diningTable = new DiningTable();
        diningTable.setCode("TB-" + suffix);
        diningTable.setName("Reservation Table " + suffix);
        diningTable.setSeatCount(4);
        diningTable.setStatus(TableStatus.AVAILABLE);
        diningTable.setActive(true);
        diningTable.setArea(area);
        return diningTableRepository.save(diningTable);
    }
}
