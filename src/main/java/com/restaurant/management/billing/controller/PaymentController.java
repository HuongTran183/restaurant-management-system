package com.restaurant.management.billing.controller;

import com.restaurant.management.billing.dto.PaymentRequest;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public PaymentResponse create(@Valid @RequestBody PaymentRequest request) {
        return paymentService.record(request);
    }
}
