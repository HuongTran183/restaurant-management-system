package com.restaurant.management.ordering.controller;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.floor.domain.TableQr;
import com.restaurant.management.floor.service.TableQrService;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.dto.OrderResponse;
import com.restaurant.management.ordering.dto.PublicQrOrderRequest;
import com.restaurant.management.ordering.dto.PublicServiceRequestRequest;
import com.restaurant.management.ordering.dto.ServiceRequestResponse;
import com.restaurant.management.ordering.service.OrderWorkflowService;
import com.restaurant.management.ordering.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicOrderingController {

    private final TableQrService tableQrService;
    private final TableSessionService tableSessionService;
    private final OrderWorkflowService orderWorkflowService;
    private final ServiceRequestService serviceRequestService;

    public PublicOrderingController(
            TableQrService tableQrService,
            TableSessionService tableSessionService,
            OrderWorkflowService orderWorkflowService,
            ServiceRequestService serviceRequestService
    ) {
        this.tableQrService = tableQrService;
        this.tableSessionService = tableSessionService;
        this.orderWorkflowService = orderWorkflowService;
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping("/qr/{token}/orders")
    public OrderResponse submitQrOrder(
            @PathVariable String token,
            @Valid @RequestBody PublicQrOrderRequest request
    ) {
        TableQr tableQr = tableQrService.findActiveByToken(token);
        Long tableSessionId = tableSessionService.findOrOpenSessionByTableId(tableQr.getDiningTable().getId()).getId();
        return orderWorkflowService.submitQrOrder(tableSessionId, request.note(), request.items());
    }

    @GetMapping("/orders/{orderCode}")
    public OrderResponse getByOrderCode(@PathVariable String orderCode) {
        return orderWorkflowService.getPublicByOrderCode(orderCode);
    }

    @PostMapping("/qr/{token}/service-requests")
    public ServiceRequestResponse createServiceRequest(
            @PathVariable String token,
            @Valid @RequestBody PublicServiceRequestRequest request
    ) {
        TableQr tableQr = tableQrService.findActiveByToken(token);
        Long tableSessionId = tableSessionService.findOrOpenSessionByTableId(tableQr.getDiningTable().getId()).getId();
        Long orderId = null;

        if (request.orderCode() != null && !request.orderCode().isBlank()) {
            OrderTicket order = orderWorkflowService.findOrderByCode(request.orderCode());
            if (order.getTableSession() == null || !order.getTableSession().getId().equals(tableSessionId)) {
                throw new BusinessConflictException("Order does not belong to this table session");
            }
            if (order.getStatus().isFinalState()) {
                throw new BusinessConflictException("Order is no longer active");
            }
            orderId = order.getId();
        } else if (request.requestType().name().equals("REQUEST_BILL")) {
            orderId = orderWorkflowService.findActiveQrOrderForSession(tableSessionId)
                    .filter(order -> order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.COMPLETED)
                    .map(OrderTicket::getId)
                    .orElse(null);
        }

        return serviceRequestService.createForSession(tableSessionId, orderId, request.requestType(), request.note());
    }
}

