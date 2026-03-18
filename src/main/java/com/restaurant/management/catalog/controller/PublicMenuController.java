package com.restaurant.management.catalog.controller;

import com.restaurant.management.catalog.dto.PublicMenuResponse;
import com.restaurant.management.catalog.service.CategoryService;
import com.restaurant.management.catalog.service.MenuItemService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/menu")
public class PublicMenuController {

    private final MenuItemService menuItemService;
    private final CategoryService categoryService;

    public PublicMenuController(MenuItemService menuItemService, CategoryService categoryService) {
        this.menuItemService = menuItemService;
        this.categoryService = categoryService;
    }

    @GetMapping
    public PublicMenuResponse getMenu() {
        return new PublicMenuResponse(
                menuItemService.getRestaurantName(),
                categoryService.listActive(),
                menuItemService.listActive()
        );
    }
}
