package com.restaurant.management.catalog.controller;

import com.restaurant.management.catalog.dto.MenuItemImageResponse;
import com.restaurant.management.catalog.dto.MenuItemRequest;
import com.restaurant.management.catalog.dto.MenuItemResponse;
import com.restaurant.management.catalog.service.MenuItemService;
import com.restaurant.management.common.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/menu-items")
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public PageResponse<MenuItemResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        return menuItemService.list(PageRequest.of(page, size, Sort.by(sort).descending()));
    }

    @GetMapping("/{menuItemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public MenuItemResponse get(@PathVariable Long menuItemId) {
        return menuItemService.get(menuItemId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public MenuItemResponse create(@Valid @RequestBody MenuItemRequest request) {
        return menuItemService.create(request);
    }

    @PutMapping("/{menuItemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public MenuItemResponse update(@PathVariable Long menuItemId, @Valid @RequestBody MenuItemRequest request) {
        return menuItemService.update(menuItemId, request);
    }

    @PostMapping(path = "/{menuItemId}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public MenuItemImageResponse uploadImage(@PathVariable Long menuItemId, @RequestPart MultipartFile file) {
        return menuItemService.uploadImage(menuItemId, file);
    }
}
