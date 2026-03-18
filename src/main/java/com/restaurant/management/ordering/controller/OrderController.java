package com.restaurant.management.ordering.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.ordering.domain.OrderSourceChannel;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.dto.AddOrderItemRequest;
import com.restaurant.management.ordering.dto.CreateOrderRequest;
import com.restaurant.management.ordering.dto.OrderResponse;
import com.restaurant.management.ordering.dto.UpdateOrderItemRequest;
import com.restaurant.management.ordering.service.OrderWorkflowService;
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
@RequestMapping("/api/orders")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class OrderController {

    private final OrderWorkflowService orderWorkflowService;

    public OrderController(OrderWorkflowService orderWorkflowService) {
        this.orderWorkflowService = orderWorkflowService;
    }

    @GetMapping
    public PageResponse<OrderResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) OrderSourceChannel sourceChannel,
            @RequestParam(required = false) Long tableSessionId,
            @RequestParam(required = false) String query
    ) {
        return orderWorkflowService.list(
                PageRequest.of(page, size, Sort.by("createdAt").descending()),
                status,
                sourceChannel,
                tableSessionId,
                query
        );
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable Long orderId) {
        return orderWorkflowService.get(orderId);
    }

    @PostMapping
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        return orderWorkflowService.create(request);
    }

    @PostMapping("/{orderId}/items")
    public OrderResponse addItem(@PathVariable Long orderId, @Valid @RequestBody AddOrderItemRequest request) {
        return orderWorkflowService.addItem(orderId, request);
    }

    @PutMapping("/{orderId}/items/{orderItemId}")
    public OrderResponse updateItem(
            @PathVariable Long orderId,
            @PathVariable Long orderItemId,
            @Valid @RequestBody UpdateOrderItemRequest request
    ) {
        return orderWorkflowService.updateItem(orderId, orderItemId, request);
    }

    @PostMapping("/{orderId}/confirm")
    public OrderResponse confirm(@PathVariable Long orderId) {
        return orderWorkflowService.confirm(orderId);
    }

    @PostMapping("/{orderId}/cancel")
    public OrderResponse cancel(@PathVariable Long orderId) {
        return orderWorkflowService.cancel(orderId);
    }
}
