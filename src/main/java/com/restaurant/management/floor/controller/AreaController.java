package com.restaurant.management.floor.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.dto.AreaRequest;
import com.restaurant.management.floor.dto.AreaResponse;
import com.restaurant.management.floor.service.AreaService;
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
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public PageResponse<AreaResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        return areaService.list(PageRequest.of(page, size, Sort.by(sort).descending()));
    }

    @GetMapping("/{areaId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public AreaResponse get(@PathVariable Long areaId) {
        return areaService.get(areaId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public AreaResponse create(@Valid @RequestBody AreaRequest request) {
        return areaService.create(request);
    }

    @PutMapping("/{areaId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public AreaResponse update(@PathVariable Long areaId, @Valid @RequestBody AreaRequest request) {
        return areaService.update(areaId, request);
    }
}
