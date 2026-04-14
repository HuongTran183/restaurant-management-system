package com.restaurant.management.ordering.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.ordering.domain.ServiceRequestStatus;
import com.restaurant.management.ordering.domain.ServiceRequestType;
import com.restaurant.management.ordering.dto.CreateServiceRequestRequest;
import com.restaurant.management.ordering.dto.ServiceRequestResponse;
import com.restaurant.management.ordering.service.ServiceRequestService;
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
@RequestMapping("/api/service-requests")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping
    public PageResponse<ServiceRequestResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ServiceRequestStatus status,
            @RequestParam(required = false) ServiceRequestType requestType,
            @RequestParam(required = false) String query
    ) {
        return serviceRequestService.list(
                PageRequest.of(page, size, Sort.by("requestedAt").ascending()),
                status,
                requestType,
                query
        );
    }

    @PostMapping
    public ServiceRequestResponse create(@Valid @RequestBody CreateServiceRequestRequest request) {
        return serviceRequestService.create(request);
    }

    @PostMapping("/{requestId}/resolve")
    public ServiceRequestResponse resolve(@PathVariable Long requestId) {
        return serviceRequestService.resolve(requestId);
    }
}
