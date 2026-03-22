package com.restaurant.management.bootstrap.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.repository.CategoryRepository;
import com.restaurant.management.catalog.repository.MenuItemRepository;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableQr;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.dto.TableQrResponse;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableQrRepository;
import com.restaurant.management.floor.service.TableQrService;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.test.util.ReflectionTestUtils;

class DemoBootstrapServiceTest {

    @Test
    void shouldSeedMinimumDemoDataAndCreateQrOnce() throws Exception {
        AreaRepository areaRepository = org.mockito.Mockito.mock(AreaRepository.class);
        DiningTableRepository diningTableRepository = org.mockito.Mockito.mock(DiningTableRepository.class);
        CategoryRepository categoryRepository = org.mockito.Mockito.mock(CategoryRepository.class);
        MenuItemRepository menuItemRepository = org.mockito.Mockito.mock(MenuItemRepository.class);
        TableQrRepository tableQrRepository = org.mockito.Mockito.mock(TableQrRepository.class);
        TableQrService tableQrService = org.mockito.Mockito.mock(TableQrService.class);

        DemoBootstrapService service = new DemoBootstrapService(
                areaRepository,
                diningTableRepository,
                categoryRepository,
                menuItemRepository,
                tableQrRepository,
                tableQrService
        );

        AtomicLong ids = new AtomicLong(1L);

        when(areaRepository.findByCodeIgnoreCase("DEMO-HALL")).thenReturn(Optional.empty());
        when(diningTableRepository.findByCodeIgnoreCase("T-01")).thenReturn(Optional.empty());
        when(categoryRepository.findByCodeIgnoreCase("DEMO-FOOD")).thenReturn(Optional.empty());
        when(menuItemRepository.findByCodeIgnoreCase("PHO-DEMO")).thenReturn(Optional.empty());
        when(tableQrRepository.findByDiningTableId(2L)).thenReturn(Optional.empty());
        when(tableQrService.generate(any())).thenReturn(
                new TableQrResponse(
                        10L,
                        2L,
                        "T-01",
                        "demo-token",
                        "Demo Table 01",
                        "http://127.0.0.1:15173/qr/demo-token",
                        "qr-codes/demo-token.png",
                        null,
                        true
                )
        );

        when(areaRepository.save(any(Area.class))).thenAnswer(invocation -> {
            Area area = invocation.getArgument(0);
            ReflectionTestUtils.setField(area, "id", ids.getAndIncrement());
            return area;
        });
        when(diningTableRepository.save(any(DiningTable.class))).thenAnswer(invocation -> {
            DiningTable diningTable = invocation.getArgument(0);
            ReflectionTestUtils.setField(diningTable, "id", ids.getAndIncrement());
            return diningTable;
        });
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            ReflectionTestUtils.setField(category, "id", ids.getAndIncrement());
            return category;
        });
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> {
            MenuItem menuItem = invocation.getArgument(0);
            ReflectionTestUtils.setField(menuItem, "id", ids.getAndIncrement());
            return menuItem;
        });

        service.run(org.mockito.Mockito.mock(ApplicationArguments.class));

        ArgumentCaptor<Area> areaCaptor = ArgumentCaptor.forClass(Area.class);
        ArgumentCaptor<DiningTable> tableCaptor = ArgumentCaptor.forClass(DiningTable.class);
        ArgumentCaptor<Category> categoryCaptor = ArgumentCaptor.forClass(Category.class);
        ArgumentCaptor<MenuItem> menuItemCaptor = ArgumentCaptor.forClass(MenuItem.class);

        verify(areaRepository).save(areaCaptor.capture());
        verify(diningTableRepository).save(tableCaptor.capture());
        verify(categoryRepository).save(categoryCaptor.capture());
        verify(menuItemRepository).save(menuItemCaptor.capture());
        verify(tableQrService).generate(any());
        verify(tableQrService, never()).getByTable(2L);

        assertThat(areaCaptor.getValue().getCode()).isEqualTo("DEMO-HALL");
        assertThat(areaCaptor.getValue().isActive()).isTrue();
        assertThat(tableCaptor.getValue().getStatus()).isEqualTo(TableStatus.AVAILABLE);
        assertThat(tableCaptor.getValue().getArea()).isSameAs(areaCaptor.getValue());
        assertThat(categoryCaptor.getValue().getCode()).isEqualTo("DEMO-FOOD");
        assertThat(menuItemCaptor.getValue().getCategory()).isSameAs(categoryCaptor.getValue());
        assertThat(menuItemCaptor.getValue().getPrice()).isEqualByComparingTo(new BigDecimal("12.50"));
    }

    @Test
    void shouldReuseExistingQrWithoutRegeneratingIt() {
        AreaRepository areaRepository = org.mockito.Mockito.mock(AreaRepository.class);
        DiningTableRepository diningTableRepository = org.mockito.Mockito.mock(DiningTableRepository.class);
        CategoryRepository categoryRepository = org.mockito.Mockito.mock(CategoryRepository.class);
        MenuItemRepository menuItemRepository = org.mockito.Mockito.mock(MenuItemRepository.class);
        TableQrRepository tableQrRepository = org.mockito.Mockito.mock(TableQrRepository.class);
        TableQrService tableQrService = org.mockito.Mockito.mock(TableQrService.class);

        DemoBootstrapService service = new DemoBootstrapService(
                areaRepository,
                diningTableRepository,
                categoryRepository,
                menuItemRepository,
                tableQrRepository,
                tableQrService
        );

        Area area = new Area();
        ReflectionTestUtils.setField(area, "id", 1L);
        area.setCode("DEMO-HALL");
        area.setName("Demo Hall");
        area.setActive(true);

        DiningTable diningTable = new DiningTable();
        ReflectionTestUtils.setField(diningTable, "id", 2L);
        diningTable.setCode("T-01");
        diningTable.setName("Table 01");
        diningTable.setSeatCount(4);
        diningTable.setStatus(TableStatus.AVAILABLE);
        diningTable.setActive(true);
        diningTable.setArea(area);

        Category category = new Category();
        ReflectionTestUtils.setField(category, "id", 3L);
        category.setCode("DEMO-FOOD");
        category.setName("Demo Food");
        category.setActive(true);

        MenuItem menuItem = new MenuItem();
        ReflectionTestUtils.setField(menuItem, "id", 4L);
        menuItem.setCode("PHO-DEMO");
        menuItem.setName("Pho Demo");
        menuItem.setPrice(new BigDecimal("12.50"));
        menuItem.setAvailable(true);
        menuItem.setActive(true);
        menuItem.setCategory(category);

        TableQr tableQr = new TableQr();
        ReflectionTestUtils.setField(tableQr, "id", 5L);
        tableQr.setDiningTable(diningTable);
        tableQr.setToken("demo-token");
        tableQr.setLabel("Demo Table 01");
        tableQr.setActive(true);

        when(areaRepository.findByCodeIgnoreCase("DEMO-HALL")).thenReturn(Optional.of(area));
        when(diningTableRepository.findByCodeIgnoreCase("T-01")).thenReturn(Optional.of(diningTable));
        when(categoryRepository.findByCodeIgnoreCase("DEMO-FOOD")).thenReturn(Optional.of(category));
        when(menuItemRepository.findByCodeIgnoreCase("PHO-DEMO")).thenReturn(Optional.of(menuItem));
        when(tableQrRepository.findByDiningTableId(2L)).thenReturn(Optional.of(tableQr));
        when(tableQrService.getByTable(2L)).thenReturn(
                new TableQrResponse(
                        5L,
                        2L,
                        "T-01",
                        "demo-token",
                        "Demo Table 01",
                        "http://127.0.0.1:15173/qr/demo-token",
                        "qr-codes/demo-token.png",
                        null,
                        true
                )
        );

        when(areaRepository.save(any(Area.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(diningTableRepository.save(any(DiningTable.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.run(org.mockito.Mockito.mock(ApplicationArguments.class));

        verify(tableQrService, never()).generate(any());
        verify(tableQrService).getByTable(2L);
    }
}
