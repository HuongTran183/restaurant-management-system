package com.restaurant.management.floor.controller;

import com.restaurant.management.floor.dto.OpenTableSessionRequest;
import com.restaurant.management.floor.dto.TableSessionResponse;
import com.restaurant.management.floor.service.TableSessionService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/table-sessions")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class TableSessionController {

    private final TableSessionService tableSessionService;

    public TableSessionController(TableSessionService tableSessionService) {
        this.tableSessionService = tableSessionService;
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
}
