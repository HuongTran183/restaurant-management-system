package com.restaurant.management.catalog.service;

import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.domain.MenuItemImage;
import com.restaurant.management.catalog.dto.MenuItemImageResponse;
import com.restaurant.management.catalog.dto.MenuItemRequest;
import com.restaurant.management.catalog.dto.MenuItemResponse;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.settings.RestaurantSettingsService;
import com.restaurant.management.common.storage.LocalFileStorage;
import com.restaurant.management.common.storage.StoredObject;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.catalog.repository.MenuItemImageRepository;
import com.restaurant.management.catalog.repository.MenuItemRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final MenuItemImageRepository menuItemImageRepository;
    private final CategoryService categoryService;
    private final LocalFileStorage localFileStorage;
    private final RestaurantSettingsService restaurantSettingsService;

    public MenuItemService(
            MenuItemRepository menuItemRepository,
            MenuItemImageRepository menuItemImageRepository,
            CategoryService categoryService,
            LocalFileStorage localFileStorage,
            RestaurantSettingsService restaurantSettingsService
    ) {
        this.menuItemRepository = menuItemRepository;
        this.menuItemImageRepository = menuItemImageRepository;
        this.categoryService = categoryService;
        this.localFileStorage = localFileStorage;
        this.restaurantSettingsService = restaurantSettingsService;
    }

    @Transactional(readOnly = true)
    public PageResponse<MenuItemResponse> list(PageRequest pageRequest) {
        Page<MenuItem> page = menuItemRepository.findAll(pageRequest);
        Map<Long, List<MenuItemImageResponse>> imagesByMenuItemId = loadImagesByMenuItemIds(
                page.getContent().stream().map(MenuItem::getId).toList()
        );

        return new PageResponse<>(
                page.getContent().stream()
                        .map(menuItem -> toResponse(menuItem, imagesByMenuItemId.getOrDefault(menuItem.getId(), List.of())))
                        .toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> listActive() {
        List<MenuItem> items = menuItemRepository.findAllByActiveTrueAndAvailableTrueAndCategoryActiveTrueOrderByCategorySortOrderAscNameAsc();
        Map<Long, List<MenuItemImageResponse>> imagesByMenuItemId = loadImagesByMenuItemIds(
                items.stream().map(MenuItem::getId).toList()
        );
        return items.stream()
                .map(menuItem -> toResponse(menuItem, imagesByMenuItemId.getOrDefault(menuItem.getId(), List.of())))
                .toList();
    }

    public String getRestaurantName() {
        return restaurantSettingsService.getRestaurantName();
    }

    @Transactional(readOnly = true)
    public MenuItemResponse get(Long menuItemId) {
        MenuItem menuItem = findMenuItem(menuItemId);
        List<MenuItemImageResponse> images = loadImagesByMenuItemIds(List.of(menuItemId))
                .getOrDefault(menuItemId, List.of());
        return toResponse(menuItem, images);
    }

    @Transactional
    public MenuItemResponse create(MenuItemRequest request) {
        menuItemRepository.findByCodeIgnoreCase(request.code()).ifPresent(existing -> {
            throw new BusinessConflictException("Menu item code already exists: " + request.code());
        });
        MenuItem menuItem = new MenuItem();
        applyRequest(menuItem, request);
        return toResponse(menuItemRepository.save(menuItem), List.of());
    }

    @Transactional
    public MenuItemResponse update(Long menuItemId, MenuItemRequest request) {
        MenuItem menuItem = findMenuItem(menuItemId);
        menuItemRepository.findByCodeIgnoreCase(request.code())
                .filter(existing -> !existing.getId().equals(menuItemId))
                .ifPresent(existing -> {
                    throw new BusinessConflictException("Menu item code already exists: " + request.code());
                });
        applyRequest(menuItem, request);
        List<MenuItemImageResponse> images = loadImagesByMenuItemIds(List.of(menuItemId)).getOrDefault(menuItemId, List.of());
        return toResponse(menuItem, images);
    }

    @Transactional
    public MenuItemImageResponse uploadImage(Long menuItemId, MultipartFile file) {
        MenuItem menuItem = findMenuItem(menuItemId);
        StoredObject storedObject = localFileStorage.storeMultipart(file, "menu-items", menuItem.getCode());
        MenuItemImage menuItemImage = new MenuItemImage();
        menuItemImage.setMenuItem(menuItem);
        menuItemImage.setFilename(storedObject.filename());
        menuItemImage.setPath(storedObject.path());
        menuItemImage.setContentType(storedObject.contentType());
        menuItemImage.setPrimaryImage(true);
        MenuItemImage saved = menuItemImageRepository.save(menuItemImage);
        return toImageResponse(saved);
    }

    public MenuItem findMenuItem(Long menuItemId) {
        return menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found: " + menuItemId));
    }

    private void applyRequest(MenuItem menuItem, MenuItemRequest request) {
        menuItem.setCode(request.code());
        menuItem.setName(request.name());
        menuItem.setDescription(request.description());
        menuItem.setPrice(request.price());
        menuItem.setAvailable(request.available());
        menuItem.setActive(request.active());
        menuItem.setCategory(categoryService.findCategory(request.categoryId()));
    }

    private Map<Long, List<MenuItemImageResponse>> loadImagesByMenuItemIds(List<Long> menuItemIds) {
        if (menuItemIds.isEmpty()) {
            return Map.of();
        }

        return menuItemImageRepository.findAllByMenuItemIdInOrderByIdAsc(menuItemIds).stream()
                .collect(Collectors.groupingBy(
                        image -> image.getMenuItem().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(this::toImageResponse, Collectors.toList())
                ));
    }

    private MenuItemResponse toResponse(MenuItem menuItem, List<MenuItemImageResponse> images) {
        return new MenuItemResponse(
                menuItem.getId(),
                menuItem.getCode(),
                menuItem.getName(),
                menuItem.getDescription(),
                menuItem.getPrice(),
                menuItem.isAvailable(),
                menuItem.isActive(),
                menuItem.getCategory().getId(),
                menuItem.getCategory().getName(),
                images
        );
    }

    private MenuItemImageResponse toImageResponse(MenuItemImage image) {
        return new MenuItemImageResponse(
                image.getId(),
                image.getFilename(),
                image.getPath(),
                image.getContentType(),
                image.isPrimaryImage()
        );
    }
}
