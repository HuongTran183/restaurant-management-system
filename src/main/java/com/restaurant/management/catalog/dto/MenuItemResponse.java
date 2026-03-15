package com.restaurant.management.catalog.dto;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemResponse(
        Long id,
        String code,
        String name,
        String description,
        BigDecimal price,
        boolean available,
        boolean active,
        Long categoryId,
        String categoryName,
        List<MenuItemImageResponse> images
) {
}
