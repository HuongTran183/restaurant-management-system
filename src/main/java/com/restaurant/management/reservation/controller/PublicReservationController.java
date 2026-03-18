package com.restaurant.management.reservation.controller;

import com.restaurant.management.reservation.dto.CancelReservationRequest;
import com.restaurant.management.reservation.dto.PublicReservationResponse;
import com.restaurant.management.reservation.dto.ReservationRequest;
import com.restaurant.management.reservation.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/reservations")
public class PublicReservationController {

    private final ReservationService reservationService;

    public PublicReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public PublicReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.getPublicByCode(reservationService.create(request).reservationCode());
    }

    @GetMapping("/{reservationCode}")
    public PublicReservationResponse get(@PathVariable String reservationCode) {
        return reservationService.getPublicByCode(reservationCode);
    }

    @PostMapping("/{reservationCode}/cancel")
    public PublicReservationResponse cancel(
            @PathVariable String reservationCode,
            @RequestBody(required = false) CancelReservationRequest request
    ) {
        return reservationService.cancelPublicByCode(reservationCode, request == null ? null : request.note());
    }
}
