package com.restaurant.management.bootstrap.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.dto.TableQrResponse;
import org.junit.jupiter.api.Test;

class DemoBootstrapServiceTest {

    @Test
    void shouldDelegateSeedingToDemoEnvironmentService() throws Exception {
        DemoEnvironmentService demoEnvironmentService = mock(DemoEnvironmentService.class);
        DemoBootstrapService service = new DemoBootstrapService(demoEnvironmentService);

        Area area = new Area();
        area.setCode("DEMO-HALL");
        DiningTable diningTable = new DiningTable();
        diningTable.setCode("T-01");
        Category category = new Category();
        category.setCode("DEMO-FOOD");
        MenuItem menuItem = new MenuItem();
        menuItem.setCode("PHO-DEMO");

        when(demoEnvironmentService.ensureBaseline()).thenReturn(new DemoEnvironmentService.DemoEnvironmentSnapshot(
                area,
                diningTable,
                category,
                menuItem,
                new TableQrResponse(
                        1L,
                        2L,
                        "T-01",
                        "demo-token",
                        "Demo Table 01",
                        "http://127.0.0.1:15173/qr/demo-token",
                        "qr-codes/demo-token.png",
                        null,
                        true
                )
        ));

        service.run(mock(org.springframework.boot.ApplicationArguments.class));

        verify(demoEnvironmentService).ensureBaseline();
    }
}
