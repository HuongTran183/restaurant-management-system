package com.restaurant.management.catalog.controller;

import com.restaurant.management.catalog.dto.PublicMenuResponse;
import com.restaurant.management.catalog.service.CategoryService;
import com.restaurant.management.catalog.service.MenuItemService;
import java.time.Duration;
import com.restaurant.management.common.diagnostics.DiagnosticsProperties;
import com.restaurant.management.common.diagnostics.PublicApiDiagnosticsRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public PublicMenuResponse getMenu(@RequestParam(defaultValue = "false") boolean includeUnavailable) {
        long startedAt = System.nanoTime();
        PublicApiDiagnosticsRecorder diagnosticsRecorder = diagnosticsRecorderProvider.getIfAvailable();

        long categoriesStartedAt = System.nanoTime();
        var categories = categoryService.listActive();
        long categoriesMs = toMillis(categoriesStartedAt);
        if (diagnosticsRecorder != null) {
            diagnosticsRecorder.recordPublicMenuStep("categories", categoriesMs);
        }

        long menuItemsStartedAt = System.nanoTime();
        var menuItems = menuItemService.listPublic(includeUnavailable);
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

    @GetMapping("/items/{menuItemId}")
    public com.restaurant.management.catalog.dto.MenuItemResponse getMenuItem(@PathVariable Long menuItemId) {
        return menuItemService.getPublic(menuItemId);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<ByteArrayResource> getImage(@PathVariable Long imageId) {
        MenuItemService.MenuItemImageAsset asset = menuItemService.getPublicImage(imageId);
        String contentType = asset.contentType() == null || asset.contentType().isBlank()
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : asset.contentType();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .contentType(MediaType.parseMediaType(contentType))
                .body(new ByteArrayResource(asset.content()));
    }

    private long toMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }
}
