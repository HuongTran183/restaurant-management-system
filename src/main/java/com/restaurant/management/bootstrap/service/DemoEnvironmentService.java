package com.restaurant.management.bootstrap.service;

import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.repository.CategoryRepository;
import com.restaurant.management.catalog.repository.MenuItemRepository;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableQr;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.dto.GenerateTableQrRequest;
import com.restaurant.management.floor.dto.TableQrResponse;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableQrRepository;
import com.restaurant.management.floor.service.TableQrService;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoEnvironmentService {

    public static final String AREA_CODE = "DEMO-HALL";
    public static final String TABLE_CODE = "T-01";
    public static final String CATEGORY_CODE = "DEMO-FOOD";
    public static final String MENU_ITEM_CODE = "PHO-DEMO";

    private static final String AREA_NAME = "Demo Hall";
    private static final String AREA_DESCRIPTION = "Local demo dining area";
    private static final String TABLE_NAME = "Table 01";
    private static final int TABLE_SEAT_COUNT = 4;
    private static final String CATEGORY_NAME = "Demo Food";
    private static final String CATEGORY_DESCRIPTION = "Local demo menu category";
    private static final String MENU_ITEM_NAME = "Pho Demo";
    private static final String MENU_ITEM_DESCRIPTION = "Local demo menu item";
    private static final BigDecimal MENU_ITEM_PRICE = new BigDecimal("12.50");
    private static final String QR_LABEL = "Demo Table 01";

    private final AreaRepository areaRepository;
    private final DiningTableRepository diningTableRepository;
    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableQrRepository tableQrRepository;
    private final TableQrService tableQrService;

    public DemoEnvironmentService(
            AreaRepository areaRepository,
            DiningTableRepository diningTableRepository,
            CategoryRepository categoryRepository,
            MenuItemRepository menuItemRepository,
            TableQrRepository tableQrRepository,
            TableQrService tableQrService
    ) {
        this.areaRepository = areaRepository;
        this.diningTableRepository = diningTableRepository;
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.tableQrRepository = tableQrRepository;
        this.tableQrService = tableQrService;
    }

    @Transactional
    public DemoEnvironmentSnapshot ensureBaseline() {
        Area area = ensureArea();
        DiningTable table = ensureTable(area);
        Category category = ensureCategory();
        MenuItem menuItem = ensureMenuItem(category);
        TableQrResponse qr = ensureQr(table);
        return new DemoEnvironmentSnapshot(area, table, category, menuItem, qr);
    }

    private Area ensureArea() {
        Area area = areaRepository.findByCodeIgnoreCase(AREA_CODE).orElseGet(Area::new);
        area.setCode(AREA_CODE);
        area.setName(AREA_NAME);
        area.setDescription(AREA_DESCRIPTION);
        area.setActive(true);
        return areaRepository.save(area);
    }

    private DiningTable ensureTable(Area area) {
        DiningTable diningTable = diningTableRepository.findByCodeIgnoreCase(TABLE_CODE).orElseGet(DiningTable::new);
        diningTable.setCode(TABLE_CODE);
        diningTable.setName(TABLE_NAME);
        diningTable.setSeatCount(TABLE_SEAT_COUNT);
        diningTable.setStatus(TableStatus.AVAILABLE);
        diningTable.setActive(true);
        diningTable.setArea(area);
        return diningTableRepository.save(diningTable);
    }

    private Category ensureCategory() {
        Category category = categoryRepository.findByCodeIgnoreCase(CATEGORY_CODE).orElseGet(Category::new);
        category.setCode(CATEGORY_CODE);
        category.setName(CATEGORY_NAME);
        category.setDescription(CATEGORY_DESCRIPTION);
        category.setSortOrder(1);
        category.setActive(true);
        return categoryRepository.save(category);
    }

    private MenuItem ensureMenuItem(Category category) {
        MenuItem menuItem = menuItemRepository.findByCodeIgnoreCase(MENU_ITEM_CODE).orElseGet(MenuItem::new);
        menuItem.setCode(MENU_ITEM_CODE);
        menuItem.setName(MENU_ITEM_NAME);
        menuItem.setDescription(MENU_ITEM_DESCRIPTION);
        menuItem.setPrice(MENU_ITEM_PRICE);
        menuItem.setAvailable(true);
        menuItem.setActive(true);
        menuItem.setCategory(category);
        return menuItemRepository.save(menuItem);
    }

    private TableQrResponse ensureQr(DiningTable diningTable) {
        TableQr existingQr = tableQrRepository.findByDiningTableId(diningTable.getId()).orElse(null);
        if (existingQr != null && existingQr.getImagePath() != null && !existingQr.getImagePath().isBlank()) {
            existingQr.setDiningTable(diningTable);
            existingQr.setLabel(QR_LABEL);
            existingQr.setActive(true);
            existingQr.setExpiresAt(null);
            tableQrRepository.save(existingQr);
            return tableQrService.getByTable(diningTable.getId());
        }

        return tableQrService.generate(new GenerateTableQrRequest(diningTable.getId(), QR_LABEL, null));
    }

    public record DemoEnvironmentSnapshot(
            Area area,
            DiningTable table,
            Category category,
            MenuItem menuItem,
            TableQrResponse qr
    ) {
    }
}
