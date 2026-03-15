package com.restaurant.management.billing.controller;

import com.restaurant.management.billing.dto.CreateInvoiceRequest;
import com.restaurant.management.billing.dto.InvoiceResponse;
import com.restaurant.management.billing.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invoices")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping("/{invoiceId}")
    public InvoiceResponse get(@PathVariable Long invoiceId) {
        return invoiceService.get(invoiceId);
    }

    @PostMapping
    public InvoiceResponse create(@Valid @RequestBody CreateInvoiceRequest request) {
        return invoiceService.create(request);
    }
}
