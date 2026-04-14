package com.restaurant.management.floor;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableSessionRepository;
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
class FloorApiIntegrationTest {

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

    @Autowired
    private TableSessionRepository tableSessionRepository;

    @Test
    void shouldFilterTablesAndNormalizePagingForStaffApi() throws Exception {
        String accessToken = loginAsSeedAdmin();
        Area area = seedArea("Patio");
        DiningTable matchingTable = seedTable(area, "PT-01", "Patio Prime", TableStatus.AVAILABLE, true);
        seedTable(area, "PT-02", "Patio Closed", TableStatus.OCCUPIED, true);
        seedTable(area, "PT-03", "Patio Disabled", TableStatus.AVAILABLE, false);

        mockMvc.perform(get("/api/tables")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .param("page", "-5")
                        .param("size", "250")
                        .param("sort", "dropTable")
                        .param("areaId", area.getId().toString())
                        .param("status", "AVAILABLE")
                        .param("active", "true")
                        .param("query", "prime"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(100))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(matchingTable.getId()))
                .andExpect(jsonPath("$.content[0].name").value("Patio Prime"))
                .andExpect(jsonPath("$.content[0].areaName").value(area.getName()));
    }

    @Test
    void shouldFilterTableSessionsAndNormalizeInvalidPageSize() throws Exception {
        String accessToken = loginAsSeedAdmin();
        Area area = seedArea("Main Hall");
        DiningTable openTable = seedTable(area, "MH-01", "Main Hall One", TableStatus.OCCUPIED, true);
        DiningTable closedTable = seedTable(area, "MH-02", "Main Hall Two", TableStatus.AVAILABLE, true);

        TableSession openSession = seedSession(openTable, TableSessionStatus.OPEN, "SESSION-OPEN");
        seedSession(closedTable, TableSessionStatus.CLOSED, "SESSION-CLOSED");

        mockMvc.perform(get("/api/table-sessions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .param("page", "-2")
                        .param("size", "0")
                        .param("status", "OPEN")
                        .param("query", "hall one"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(openSession.getId()))
                .andExpect(jsonPath("$.content[0].tableName").value("Main Hall One"));
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

    private Area seedArea(String name) {
        String suffix = String.valueOf(System.nanoTime());

        Area area = new Area();
        area.setCode("AREA-" + suffix);
        area.setName(name + " " + suffix);
        area.setDescription("Floor integration test area");
        area.setActive(true);
        return areaRepository.save(area);
    }

    private DiningTable seedTable(Area area, String codePrefix, String name, TableStatus status, boolean active) {
        DiningTable diningTable = new DiningTable();
        diningTable.setCode(codePrefix + "-" + System.nanoTime());
        diningTable.setName(name);
        diningTable.setSeatCount(4);
        diningTable.setStatus(status);
        diningTable.setActive(active);
        diningTable.setArea(area);
        return diningTableRepository.save(diningTable);
    }

    private TableSession seedSession(DiningTable diningTable, TableSessionStatus status, String sessionPrefix) {
        TableSession session = new TableSession();
        session.setDiningTable(diningTable);
        session.setSessionCode(sessionPrefix + "-" + System.nanoTime());
        session.setStatus(status);
        session.setOpenedAt(Instant.now().minusSeconds(status == TableSessionStatus.OPEN ? 600 : 1200));
        session.setClosedAt(status == TableSessionStatus.CLOSED ? Instant.now().minusSeconds(300) : null);
        return tableSessionRepository.save(session);
    }
}
