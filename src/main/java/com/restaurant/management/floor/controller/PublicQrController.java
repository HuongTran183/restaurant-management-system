package com.restaurant.management.floor.controller;

import com.restaurant.management.floor.dto.PublicQrTableResponse;
import com.restaurant.management.floor.service.TableQrService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/qr")
public class PublicQrController {

    private final TableQrService tableQrService;

    public PublicQrController(TableQrService tableQrService) {
        this.tableQrService = tableQrService;
    }

    @GetMapping("/{token}")
    public PublicQrTableResponse resolve(@PathVariable String token) {
        return tableQrService.resolvePublic(token);
    }
}
