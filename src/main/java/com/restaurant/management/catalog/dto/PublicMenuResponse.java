package com.restaurant.management.catalog.dto;

import java.util.List;

public record PublicMenuResponse(
        String restaurantName,
        List<CategoryResponse> categories,
        List<MenuItemResponse> items
) {
}
