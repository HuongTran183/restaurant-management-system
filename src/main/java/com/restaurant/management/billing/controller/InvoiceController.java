package com.restaurant.management.billing.controller;

import com.restaurant.management.billing.domain.InvoiceStatus;
import com.restaurant.management.billing.dto.CreateInvoiceRequest;
import com.restaurant.management.billing.dto.InvoiceResponse;
import com.restaurant.management.billing.service.InvoiceService;
import com.restaurant.management.common.web.PageResponse;
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
@RequestMapping("/api/invoices")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public PageResponse<InvoiceResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String query
    ) {
        return invoiceService.list(
                PageRequest.of(page, size, Sort.by("issuedAt").descending()),
                status,
                query
        );
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
