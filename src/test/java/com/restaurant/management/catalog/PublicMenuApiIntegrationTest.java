package com.restaurant.management.catalog;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.repository.CategoryRepository;
import com.restaurant.management.catalog.repository.MenuItemRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers(disabledWithoutDocker = true)
class PublicMenuApiIntegrationTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("restaurant_management_test")
            .withUsername("restaurant")
            .withPassword("restaurant");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Test
    void shouldReturnOnlyActiveAvailableMenuItemsFromActiveCategories() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        Category activeCategory = saveCategory("ACTIVE-" + suffix, true, 1);
        Category inactiveCategory = saveCategory("INACTIVE-" + suffix, false, 2);

        saveMenuItem(activeCategory, "AVAILABLE-" + suffix, true, true, "Pho Active " + suffix);
        saveMenuItem(activeCategory, "UNAVAILABLE-" + suffix, true, false, "Pho Unavailable " + suffix);
        saveMenuItem(inactiveCategory, "INACTIVE-CATEGORY-" + suffix, true, true, "Pho Hidden " + suffix);

        mockMvc.perform(get("/api/public/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.restaurantName").value("Demo Restaurant"))
                .andExpect(jsonPath("$.categories[?(@.code=='ACTIVE-" + suffix + "')]").exists())
                .andExpect(jsonPath("$.categories[?(@.code=='INACTIVE-" + suffix + "')]").isEmpty())
                .andExpect(jsonPath("$.items[?(@.code=='AVAILABLE-" + suffix + "')]").exists())
                .andExpect(jsonPath("$.items[?(@.code=='UNAVAILABLE-" + suffix + "')]").isEmpty())
                .andExpect(jsonPath("$.items[?(@.code=='INACTIVE-CATEGORY-" + suffix + "')]").isEmpty());
    }

    private Category saveCategory(String code, boolean active, int sortOrder) {
        Category category = new Category();
        category.setCode(code);
        category.setName(code);
        category.setDescription("Test category " + code);
        category.setSortOrder(sortOrder);
        category.setActive(active);
        return categoryRepository.save(category);
    }

    private void saveMenuItem(Category category, String code, boolean active, boolean available, String name) {
        MenuItem menuItem = new MenuItem();
        menuItem.setCode(code);
        menuItem.setName(name);
        menuItem.setDescription("Test menu item " + code);
        menuItem.setPrice(new BigDecimal("125000.00"));
        menuItem.setAvailable(available);
        menuItem.setActive(active);
        menuItem.setCategory(category);
        menuItemRepository.save(menuItem);
    }
}
