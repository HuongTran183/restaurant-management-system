package com.restaurant.management.catalog.dto;

public record MenuItemImageResponse(
        Long id,
        String filename,
        String path,
        String contentType,
        boolean primaryImage,
        String imageUrl
) {
}
