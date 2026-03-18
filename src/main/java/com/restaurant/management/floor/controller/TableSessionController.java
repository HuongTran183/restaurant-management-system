package com.restaurant.management.floor.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.dto.OpenTableSessionRequest;
import com.restaurant.management.floor.dto.TableSessionResponse;
import com.restaurant.management.floor.service.TableSessionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/table-sessions")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class TableSessionController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final TableSessionService tableSessionService;

    public TableSessionController(TableSessionService tableSessionService) {
        this.tableSessionService = tableSessionService;
    }

    @GetMapping
    public PageResponse<TableSessionResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TableSessionStatus status,
            @RequestParam(required = false) Long diningTableId,
            @RequestParam(required = false) String query
    ) {
        return tableSessionService.list(
                PageRequest.of(normalizePage(page), normalizeSize(size), Sort.by("openedAt").descending()),
                status,
                diningTableId,
                query
        );
    }

    @GetMapping("/{sessionId}")
    public TableSessionResponse get(@PathVariable Long sessionId) {
        return tableSessionService.get(sessionId);
    }

    @PostMapping
    public TableSessionResponse open(@Valid @RequestBody OpenTableSessionRequest request) {
        return tableSessionService.open(request);
    }

    @PostMapping("/{sessionId}/close")
    public TableSessionResponse close(@PathVariable Long sessionId) {
        return tableSessionService.close(sessionId);
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
}
