package com.restaurant.management.reservation.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.reservation.domain.ReservationStatus;
import com.restaurant.management.reservation.dto.CancelReservationRequest;
import com.restaurant.management.reservation.dto.CheckInReservationRequest;
import com.restaurant.management.reservation.dto.ConfirmReservationRequest;
import com.restaurant.management.reservation.dto.ReservationRequest;
import com.restaurant.management.reservation.dto.ReservationResponse;
import com.restaurant.management.reservation.service.ReservationService;
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
@RequestMapping("/api/reservations")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public PageResponse<ReservationResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) String query
    ) {
        return reservationService.list(PageRequest.of(page, size, Sort.by("reservationTime").ascending()), status, query);
    }

    @GetMapping("/{reservationId}")
    public ReservationResponse get(@PathVariable Long reservationId) {
        return reservationService.get(reservationId);
    }

    @PostMapping
    public ReservationResponse create(@Valid @RequestBody ReservationRequest request) {
        return reservationService.create(request);
    }

    @PostMapping("/{reservationId}/confirm")
    public ReservationResponse confirm(
            @PathVariable Long reservationId,
            @RequestBody(required = false) ConfirmReservationRequest request
    ) {
        return reservationService.confirm(reservationId, request == null ? null : request.internalNote());
    }

    @PostMapping("/{reservationId}/cancel")
    public ReservationResponse cancel(
            @PathVariable Long reservationId,
            @RequestBody(required = false) CancelReservationRequest request
    ) {
        return reservationService.cancel(reservationId, request == null ? null : request.note());
    }

    @PostMapping("/{reservationId}/check-in")
    public ReservationResponse checkIn(
            @PathVariable Long reservationId,
            @Valid @RequestBody CheckInReservationRequest request
    ) {
        return reservationService.checkIn(reservationId, request.diningTableId(), request.internalNote());
    }

    @PostMapping("/{reservationId}/complete")
    public ReservationResponse complete(@PathVariable Long reservationId) {
        return reservationService.complete(reservationId);
    }
}
