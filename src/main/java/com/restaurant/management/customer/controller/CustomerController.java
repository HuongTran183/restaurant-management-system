package com.restaurant.management.customer.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.customer.dto.CustomerRequest;
import com.restaurant.management.customer.dto.CustomerResponse;
import com.restaurant.management.customer.service.CustomerService;
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
@RequestMapping("/api/customers")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER','CASHIER')")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public PageResponse<CustomerResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean active
    ) {
        return customerService.list(PageRequest.of(page, size, Sort.by("createdAt").descending()), query, active);
    }

    @GetMapping("/{customerId}")
    public CustomerResponse get(@PathVariable Long customerId) {
        return customerService.get(customerId);
    }

    @PostMapping
    public CustomerResponse create(@Valid @RequestBody CustomerRequest request) {
        return customerService.create(request);
    }

    @PutMapping("/{customerId}")
    public CustomerResponse update(@PathVariable Long customerId, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(customerId, request);
    }
}
