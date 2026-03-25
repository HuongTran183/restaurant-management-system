package com.restaurant.management.bootstrap.controller;

import com.restaurant.management.bootstrap.dto.DevResetResponse;
import com.restaurant.management.bootstrap.dto.DevScenarioResponse;
import com.restaurant.management.bootstrap.service.DevSupportService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev")
@Profile({"local", "test"})
@ConditionalOnProperty(prefix = "app.dev-support", name = "enabled", havingValue = "true")
@PreAuthorize("hasRole('ADMIN')")
public class DevSupportController {

    private final DevSupportService devSupportService;

    public DevSupportController(DevSupportService devSupportService) {
        this.devSupportService = devSupportService;
    }

    @PostMapping("/reset")
    public DevResetResponse reset() {
        return devSupportService.reset();
    }

    @PostMapping("/scenarios/baseline")
    public DevScenarioResponse baseline() {
        return devSupportService.baseline();
    }

    @PostMapping("/scenarios/draft-order")
    public DevScenarioResponse draftOrder() {
        return devSupportService.draftOrder();
    }

    @PostMapping("/scenarios/pending-bill")
    public DevScenarioResponse pendingBill() {
        return devSupportService.pendingBill();
    }

    @PostMapping("/scenarios/open-invoice")
    public DevScenarioResponse openInvoice() {
        return devSupportService.openInvoice();
    }

    @PostMapping("/scenarios/payment-history")
    public DevScenarioResponse paymentHistory() {
        return devSupportService.paymentHistory();
    }
}
