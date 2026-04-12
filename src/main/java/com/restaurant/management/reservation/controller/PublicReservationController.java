package com.restaurant.management.reservation.controller;

import com.restaurant.management.reservation.dto.CancelReservationRequest;
import com.restaurant.management.reservation.dto.PublicBookingOptionsResponse;
import com.restaurant.management.reservation.dto.PublicReservationResponse;
import com.restaurant.management.reservation.dto.PublicReservationRescheduleRequest;
import com.restaurant.management.reservation.dto.PublicReservationSearchRequest;
import com.restaurant.management.reservation.dto.PublicReservationSearchResponse;
import com.restaurant.management.reservation.dto.ReservationRequest;
import com.restaurant.management.reservation.service.ReservationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
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

    @PostMapping("/lookup")
    public PublicReservationSearchResponse lookup(@Valid @RequestBody PublicReservationSearchRequest request) {
        return reservationService.lookupPublic(request.query());
    }

    @GetMapping("/options")
    public PublicBookingOptionsResponse options(
            @RequestParam @Future Instant reservationTime,
            @RequestParam @Min(1) int partySize
    ) {
        return reservationService.getPublicBookingOptions(reservationTime, partySize);
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

    @PostMapping("/{reservationCode}/reschedule")
    public PublicReservationResponse reschedule(
            @PathVariable String reservationCode,
            @Valid @RequestBody PublicReservationRescheduleRequest request
    ) {
        return reservationService.reschedulePublicByCode(reservationCode, request.phone(), request.reservationTime());
    }
}
