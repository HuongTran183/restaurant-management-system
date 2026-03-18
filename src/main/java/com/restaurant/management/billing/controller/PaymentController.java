package com.restaurant.management.billing.controller;

import com.restaurant.management.billing.domain.PaymentMethod;
import com.restaurant.management.billing.dto.PaymentRequest;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.service.PaymentService;
import com.restaurant.management.common.web.PageResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public PageResponse<PaymentResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) PaymentMethod method,
            @RequestParam(required = false) String query
    ) {
        return paymentService.list(
                PageRequest.of(page, size, Sort.by("paidAt").descending()),
                invoiceId,
                method,
                query
        );
    }

    @PostMapping
    public PaymentResponse create(@Valid @RequestBody PaymentRequest request) {
        return paymentService.record(request);
    }
}
