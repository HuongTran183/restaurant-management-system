package com.restaurant.management.catalog.service;

import com.restaurant.management.catalog.domain.Category;
import com.restaurant.management.catalog.dto.CategoryRequest;
import com.restaurant.management.catalog.dto.CategoryResponse;
import com.restaurant.management.catalog.repository.CategoryRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public PageResponse<CategoryResponse> list(PageRequest pageRequest) {
        return PageResponse.from(categoryRepository.findAll(pageRequest).map(this::toResponse));
    }

    public CategoryResponse get(Long categoryId) {
        return toResponse(findCategory(categoryId));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        categoryRepository.findByCodeIgnoreCase(request.code()).ifPresent(existing -> {
            throw new BusinessConflictException("Category code already exists: " + request.code());
        });
        Category category = new Category();
        applyRequest(category, request);
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long categoryId, CategoryRequest request) {
        Category category = findCategory(categoryId);
        categoryRepository.findByCodeIgnoreCase(request.code())
                .filter(existing -> !existing.getId().equals(categoryId))
                .ifPresent(existing -> {
                    throw new BusinessConflictException("Category code already exists: " + request.code());
                });
        applyRequest(category, request);
        return toResponse(category);
    }

    public Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private void applyRequest(Category category, CategoryRequest request) {
        category.setCode(request.code());
        category.setName(request.name());
        category.setDescription(request.description());
        category.setSortOrder(request.sortOrder());
        category.setActive(request.active());
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getSortOrder(),
                category.isActive()
        );
    }
}
