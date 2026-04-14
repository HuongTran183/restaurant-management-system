package com.restaurant.management.floor.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.dto.DiningTableRequest;
import com.restaurant.management.floor.dto.DiningTableResponse;
import com.restaurant.management.floor.dto.GenerateTableQrRequest;
import com.restaurant.management.floor.dto.TableQrResponse;
import com.restaurant.management.floor.service.DiningTableService;
import com.restaurant.management.floor.service.TableQrService;
import jakarta.validation.Valid;
import java.util.Set;
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
@RequestMapping("/api/tables")
public class DiningTableController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("createdAt", "code", "name", "seatCount", "status");

    private final DiningTableService diningTableService;
    private final TableQrService tableQrService;

    public DiningTableController(DiningTableService diningTableService, TableQrService tableQrService) {
        this.diningTableService = diningTableService;
        this.tableQrService = tableQrService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public PageResponse<DiningTableResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(required = false) Long areaId,
            @RequestParam(required = false) TableStatus status,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String query
    ) {
        return diningTableService.list(
                PageRequest.of(normalizePage(page), normalizeSize(size), Sort.by(resolveSort(sort)).descending()),
                areaId,
                status,
                active,
                query
        );
    }

    @GetMapping("/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public DiningTableResponse get(@PathVariable Long tableId) {
        return diningTableService.get(tableId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public DiningTableResponse create(@Valid @RequestBody DiningTableRequest request) {
        return diningTableService.create(request);
    }

    @PutMapping("/{tableId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public DiningTableResponse update(@PathVariable Long tableId, @Valid @RequestBody DiningTableRequest request) {
        return diningTableService.update(tableId, request);
    }

    @GetMapping("/{tableId}/qr")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public TableQrResponse getQr(@PathVariable Long tableId) {
        return tableQrService.getByTable(tableId);
    }

    @PostMapping("/{tableId}/qr")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TableQrResponse generateQr(@PathVariable Long tableId, @Valid @RequestBody GenerateTableQrRequest request) {
        return tableQrService.generate(new GenerateTableQrRequest(tableId, request.label(), request.expiresAt()));
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String resolveSort(String sort) {
        return ALLOWED_SORT_FIELDS.contains(sort) ? sort : "createdAt";
    }
}
