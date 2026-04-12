package com.restaurant.management.ordering.controller;

import com.restaurant.management.ordering.dto.KitchenItemResponse;
import com.restaurant.management.ordering.service.OrderWorkflowService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/kitchen")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class KitchenDisplayController {

    private final OrderWorkflowService orderWorkflowService;

    public KitchenDisplayController(OrderWorkflowService orderWorkflowService) {
        this.orderWorkflowService = orderWorkflowService;
    }

    @GetMapping("/queue")
    public List<KitchenItemResponse> getQueue() {
        return orderWorkflowService.getKitchenQueue();
    }

    @PostMapping("/items/{itemId}/prepare")
    public KitchenItemResponse startPreparing(@PathVariable Long itemId) {
        return orderWorkflowService.startPreparing(itemId);
    }

    @PostMapping("/items/{itemId}/ready")
    public KitchenItemResponse markReady(@PathVariable Long itemId) {
        return orderWorkflowService.markReady(itemId);
    }

    @PostMapping("/items/{itemId}/served")
    public KitchenItemResponse markServed(@PathVariable Long itemId) {
        return orderWorkflowService.markServed(itemId);
    }
}
