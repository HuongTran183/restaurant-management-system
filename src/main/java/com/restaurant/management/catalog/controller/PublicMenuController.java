package com.restaurant.management.catalog.controller;

import com.restaurant.management.catalog.dto.PublicMenuResponse;
import com.restaurant.management.catalog.service.CategoryService;
import com.restaurant.management.catalog.service.MenuItemService;
import com.restaurant.management.common.diagnostics.DiagnosticsProperties;
import com.restaurant.management.common.diagnostics.PublicApiDiagnosticsRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/menu")
public class PublicMenuController {

    private static final Logger log = LoggerFactory.getLogger(PublicMenuController.class);

    private final MenuItemService menuItemService;
    private final CategoryService categoryService;
    private final DiagnosticsProperties diagnosticsProperties;
    private final ObjectProvider<PublicApiDiagnosticsRecorder> diagnosticsRecorderProvider;

    public PublicMenuController(
            MenuItemService menuItemService,
            CategoryService categoryService,
            DiagnosticsProperties diagnosticsProperties,
            ObjectProvider<PublicApiDiagnosticsRecorder> diagnosticsRecorderProvider
    ) {
        this.menuItemService = menuItemService;
        this.categoryService = categoryService;
        this.diagnosticsProperties = diagnosticsProperties;
        this.diagnosticsRecorderProvider = diagnosticsRecorderProvider;
    }

    @GetMapping
    public PublicMenuResponse getMenu() {
        long startedAt = System.nanoTime();
        PublicApiDiagnosticsRecorder diagnosticsRecorder = diagnosticsRecorderProvider.getIfAvailable();

        long categoriesStartedAt = System.nanoTime();
        var categories = categoryService.listActive();
        long categoriesMs = toMillis(categoriesStartedAt);
        if (diagnosticsRecorder != null) {
            diagnosticsRecorder.recordPublicMenuStep("categories", categoriesMs);
        }

        long menuItemsStartedAt = System.nanoTime();
        var menuItems = menuItemService.listActive();
        long menuItemsMs = toMillis(menuItemsStartedAt);
        if (diagnosticsRecorder != null) {
            diagnosticsRecorder.recordPublicMenuStep("menu_items", menuItemsMs);
        }

        PublicMenuResponse response = new PublicMenuResponse(
                menuItemService.getRestaurantName(),
                categories,
                menuItems
        );

        if (diagnosticsProperties.isEnabled()) {
            long totalMs = toMillis(startedAt);
            if (diagnosticsRecorder != null) {
                diagnosticsRecorder.recordPublicMenuStep("total", totalMs);
            }
            log.info(
                    "Public menu timings: correlationId={}, categoriesMs={}, menuItemsMs={}, totalMs={}, categoryCount={}, itemCount={}",
                    MDC.get("correlationId"),
                    categoriesMs,
                    menuItemsMs,
                    totalMs,
                    categories.size(),
                    menuItems.size()
            );
        }

        return response;
    }

    private long toMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
