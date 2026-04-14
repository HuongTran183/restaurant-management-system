package com.restaurant.management.ordering;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.repository.CategoryRepository;
import com.restaurant.management.catalog.repository.MenuItemRepository;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableQr;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableQrRepository;
import com.restaurant.management.ordering.domain.OrderSourceChannel;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.domain.OrderType;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class PublicOrderingApiIntegrationTest {

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
    private TableQrRepository tableQrRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void shouldCreateQrOrderAndRequestBillFromPublicEndpoints() throws Exception {
        SeededScenario scenario = seedScenario();

        MvcResult createOrderResult = mockMvc.perform(post("/api/public/qr/{token}/orders", scenario.tableQr().getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "note": "Lunch order",
                                  "items": [
                                    {
                                      "menuItemId": %d,
                                      "quantity": 2,
                                      "note": "Less onion"
                                    }
                                  ]
                                }
                                """.formatted(scenario.menuItem().getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceChannel").value("QR"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.items[0].status").value("NEW"))
                .andReturn();

        JsonNode createOrderJson = objectMapper.readTree(createOrderResult.getResponse().getContentAsString());
        String orderCode = createOrderJson.path("orderCode").asText();

        mockMvc.perform(post("/api/public/qr/{token}/service-requests", scenario.tableQr().getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "orderCode": "%s",
                                  "requestType": "REQUEST_BILL",
                                  "note": "Please bring the bill"
                                }
                                """.formatted(orderCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestType").value("REQUEST_BILL"))
                .andExpect(jsonPath("$.orderId").isNumber());

        mockMvc.perform(get("/api/public/orders/{orderCode}", orderCode))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value(orderCode))
                .andExpect(jsonPath("$.paymentRequested").value(true))
                .andExpect(jsonPath("$.sourceChannel").value("QR"))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void shouldRejectStaffOrdersFromPublicLookup() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        OrderTicket staffOrder = new OrderTicket();
        staffOrder.setOrderCode("ORD-STAFF-" + suffix);
        staffOrder.setOrderType(OrderType.TAKEAWAY);
        staffOrder.setSourceChannel(OrderSourceChannel.STAFF);
        staffOrder.setStatus(com.restaurant.management.ordering.domain.OrderStatus.CONFIRMED);
        staffOrder.setSubtotal(new BigDecimal("250000.00"));
        staffOrder.setServiceFee(BigDecimal.ZERO.setScale(2));
        staffOrder.setVatAmount(BigDecimal.ZERO.setScale(2));
        staffOrder.setDiscountAmount(BigDecimal.ZERO.setScale(2));
        staffOrder.setTotalAmount(new BigDecimal("250000.00"));
        staffOrder.setPaymentRequested(false);
        orderRepository.save(staffOrder);

        mockMvc.perform(get("/api/public/orders/{orderCode}", staffOrder.getOrderCode()))
                .andExpect(status().isNotFound());
    }

    private SeededScenario seedScenario() {
        String suffix = String.valueOf(System.nanoTime());

        Area area = new Area();
        area.setCode("AREA-" + suffix);
        area.setName("Main Hall " + suffix);
        area.setDescription("Public ordering test area");
        area.setActive(true);
        area = areaRepository.save(area);

        DiningTable diningTable = new DiningTable();
        diningTable.setCode("TB-" + suffix);
        diningTable.setName("Table " + suffix);
        diningTable.setSeatCount(4);
        diningTable.setStatus(TableStatus.AVAILABLE);
        diningTable.setActive(true);
        diningTable.setArea(area);
        diningTable = diningTableRepository.save(diningTable);

        Category category = new Category();
        category.setCode("CAT-" + suffix);
        category.setName("Noodles " + suffix);
        category.setDescription("Public ordering test category");
        category.setSortOrder(1);
        category.setActive(true);
        category = categoryRepository.save(category);

        MenuItem menuItem = new MenuItem();
        menuItem.setCode("ITEM-" + suffix);
        menuItem.setName("Pho Special " + suffix);
        menuItem.setDescription("Public ordering test item");
        menuItem.setPrice(new BigDecimal("125000.00"));
        menuItem.setAvailable(true);
        menuItem.setActive(true);
        menuItem.setCategory(category);
        menuItem = menuItemRepository.save(menuItem);

        TableQr tableQr = new TableQr();
        tableQr.setDiningTable(diningTable);
        tableQr.setToken("token-" + suffix);
        tableQr.setLabel(diningTable.getName());
        tableQr.setImagePath("qr-codes/" + suffix + ".png");
        tableQr.setExpiresAt(Instant.now().plusSeconds(86_400));
        tableQr.setActive(true);
        tableQr = tableQrRepository.save(tableQr);

        return new SeededScenario(tableQr, menuItem);
    }

    private record SeededScenario(TableQr tableQr, MenuItem menuItem) {
    }
}
