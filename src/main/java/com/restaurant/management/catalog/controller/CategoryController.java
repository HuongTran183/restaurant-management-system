package com.restaurant.management.catalog.controller;

import com.restaurant.management.catalog.dto.CategoryRequest;
import com.restaurant.management.catalog.dto.CategoryResponse;
import com.restaurant.management.catalog.service.CategoryService;
import com.restaurant.management.common.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public PageResponse<CategoryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        return categoryService.list(PageRequest.of(page, size, Sort.by(sort).descending()));
    }

    @GetMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public CategoryResponse get(@PathVariable Long categoryId) {
        return categoryService.get(categoryId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public CategoryResponse update(@PathVariable Long categoryId, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(categoryId, request);
    }
}
