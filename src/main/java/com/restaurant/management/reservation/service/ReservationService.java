package com.restaurant.management.reservation.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.floor.service.DiningTableService;
import com.restaurant.management.reservation.domain.Reservation;
import com.restaurant.management.reservation.domain.ReservationHistory;
import com.restaurant.management.reservation.domain.ReservationStatus;
import com.restaurant.management.reservation.dto.PublicReservationResponse;
import com.restaurant.management.reservation.dto.ReservationRequest;
import com.restaurant.management.reservation.dto.ReservationResponse;
import com.restaurant.management.reservation.repository.ReservationHistoryRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationHistoryRepository reservationHistoryRepository;
    private final DiningTableService diningTableService;
    private final TableSessionRepository tableSessionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public ReservationService(
            ReservationRepository reservationRepository,
            ReservationHistoryRepository reservationHistoryRepository,
            DiningTableService diningTableService,
            TableSessionRepository tableSessionRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.diningTableService = diningTableService;
        this.tableSessionRepository = tableSessionRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> list(PageRequest pageRequest, ReservationStatus status, String query) {
        Page<Reservation> page = reservationRepository.findAll(byFilters(status, query), pageRequest);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ReservationResponse get(Long reservationId) {
        return toResponse(findReservation(reservationId));
    }

    @Transactional(readOnly = true)
    public ReservationResponse getByCode(String reservationCode) {
        return toResponse(findByCode(reservationCode));
    }

    @Transactional(readOnly = true)
    public PublicReservationResponse getPublicByCode(String reservationCode) {
        return toPublicResponse(findByCode(reservationCode));
    }

    @Transactional
    public ReservationResponse create(ReservationRequest request) {
        Reservation reservation = new Reservation();
        reservation.setReservationCode(nextCode());
        applyRequest(reservation, request);
        Reservation saved = reservationRepository.save(reservation);
        recordHistory(saved, null, ReservationStatus.PENDING, "Reservation created");
        return toResponse(saved);
    }

    @Transactional
    public ReservationResponse confirm(Long reservationId, String internalNote) {
        Reservation reservation = findReservation(reservationId);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessConflictException("Only pending reservations can be confirmed");
        }
        reservation.setInternalNote(isBlank(internalNote) ? reservation.getInternalNote() : internalNote.trim());
        reservation.setConfirmedAt(Instant.now());
        changeStatus(reservation, ReservationStatus.CONFIRMED, "Reservation confirmed");
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse cancelByCode(String reservationCode, String note) {
        return cancel(findByCode(reservationCode).getId(), note);
    }

    @Transactional
    public PublicReservationResponse cancelPublicByCode(String reservationCode, String note) {
        Reservation reservation = findByCode(reservationCode);
        return toPublicResponse(cancelInternal(reservation, note, false));
    }

    @Transactional
    public ReservationResponse cancel(Long reservationId, String note) {
        Reservation reservation = findReservation(reservationId);
        return toResponse(cancelInternal(reservation, note, true));
    }

    @Transactional
    public ReservationResponse checkIn(Long reservationId, Long diningTableId, String internalNote) {
        Reservation reservation = findReservation(reservationId);
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessConflictException("Only confirmed reservations can be checked in");
        }

        DiningTable diningTable = diningTableService.findTable(diningTableId);
        if (!diningTable.isActive()) {
            throw new BusinessConflictException("Assigned table is inactive: " + diningTable.getCode());
        }
        if (diningTable.getStatus() == TableStatus.CLEANING || diningTable.getStatus() == TableStatus.LOCKED) {
            throw new BusinessConflictException("Assigned table is not ready for service: " + diningTable.getCode());
        }
        tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(diningTable.getId(), TableSessionStatus.OPEN)
                .ifPresent(session -> {
                    throw new BusinessConflictException("Assigned table already has an open session: " + diningTable.getCode());
                });

        reservation.setAssignedTable(diningTable);
        reservation.setInternalNote(isBlank(internalNote) ? reservation.getInternalNote() : internalNote.trim());
        reservation.setCheckedInAt(Instant.now());
        diningTable.setStatus(TableStatus.OCCUPIED);
        changeStatus(reservation, ReservationStatus.CHECKED_IN, "Reservation checked in");
        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse complete(Long reservationId) {
        Reservation reservation = findReservation(reservationId);
        if (reservation.getStatus() != ReservationStatus.CHECKED_IN) {
            throw new BusinessConflictException("Only checked-in reservations can be completed");
        }
        reservation.setCompletedAt(Instant.now());
        releaseAssignedTableIfIdle(reservation);
        changeStatus(reservation, ReservationStatus.COMPLETED, "Reservation completed");
        return toResponse(reservation);
    }

    public Reservation findReservation(Long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
    }

    private Reservation findByCode(String reservationCode) {
        return reservationRepository.findByReservationCodeIgnoreCase(reservationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationCode));
    }

    private Specification<Reservation> byFilters(ReservationStatus status, String query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            var predicate = criteriaBuilder.conjunction();
            if (status != null) {
                predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("status"), status));
            }
            if (query != null && !query.isBlank()) {
                String keyword = "%" + query.trim().toLowerCase() + "%";
                predicate = criteriaBuilder.and(
                        predicate,
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("reservationCode")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("customerName")), keyword),
                                criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), keyword)
                        )
                );
            }
            criteriaQuery.orderBy(criteriaBuilder.asc(root.get("reservationTime")));
            return predicate;
        };
    }

    private void applyRequest(Reservation reservation, ReservationRequest request) {
        reservation.setCustomerName(request.customerName().trim());
        reservation.setPhone(request.phone().trim());
        reservation.setEmail(request.email() == null || request.email().isBlank() ? null : request.email().trim());
        reservation.setPartySize(request.partySize());
        reservation.setReservationTime(request.reservationTime());
        reservation.setRequestedArea(isBlank(request.requestedArea()) ? null : request.requestedArea().trim());
        reservation.setNote(isBlank(request.note()) ? null : request.note().trim());
    }

    private Reservation cancelInternal(Reservation reservation, String note, boolean updateInternalNote) {
        if (reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BusinessConflictException("Reservation is already closed");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new BusinessConflictException("Only pending or confirmed reservations can be cancelled");
        }
        reservation.setCancelledAt(Instant.now());
        if (updateInternalNote && !isBlank(note)) {
            reservation.setInternalNote(note.trim());
        }
        releaseAssignedTableIfIdle(reservation);
        changeStatus(reservation, ReservationStatus.CANCELLED, isBlank(note) ? "Reservation cancelled" : note.trim());
        return reservation;
    }

    private void changeStatus(Reservation reservation, ReservationStatus targetStatus, String note) {
        ReservationStatus previousStatus = reservation.getStatus();
        reservation.setStatus(targetStatus);
        recordHistory(reservation, previousStatus, targetStatus, note);
    }

    private void recordHistory(Reservation reservation, ReservationStatus fromStatus, ReservationStatus toStatus, String note) {
        ReservationHistory history = new ReservationHistory();
        history.setReservation(reservation);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setNote(note);
        history.setChangedAt(Instant.now());
        reservationHistoryRepository.save(history);
    }

    private void releaseAssignedTableIfIdle(Reservation reservation) {
        if (reservation.getAssignedTable() == null) {
            return;
        }
        boolean hasOpenSession = tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(
                reservation.getAssignedTable().getId(),
                TableSessionStatus.OPEN
        ).isPresent();
        if (!hasOpenSession) {
            reservation.getAssignedTable().setStatus(TableStatus.AVAILABLE);
        }
    }

    private ReservationResponse toResponse(Reservation reservation) {
        return new ReservationResponse(
                reservation.getId(),
                reservation.getReservationCode(),
                reservation.getCustomerName(),
                reservation.getPhone(),
                reservation.getEmail(),
                reservation.getPartySize(),
                reservation.getReservationTime(),
                reservation.getStatus(),
                reservation.getRequestedArea(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getId(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getCode(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getName(),
                reservation.getNote(),
                reservation.getInternalNote(),
                reservation.getConfirmedAt(),
                reservation.getCancelledAt(),
                reservation.getCheckedInAt(),
                reservation.getCompletedAt()
        );
    }

    private PublicReservationResponse toPublicResponse(Reservation reservation) {
        return new PublicReservationResponse(
                reservation.getId(),
                reservation.getReservationCode(),
                reservation.getCustomerName(),
                reservation.getPhone(),
                reservation.getEmail(),
                reservation.getPartySize(),
                reservation.getReservationTime(),
                reservation.getStatus(),
                reservation.getRequestedArea(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getId(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getCode(),
                reservation.getAssignedTable() == null ? null : reservation.getAssignedTable().getName(),
                reservation.getNote(),
                reservation.getConfirmedAt(),
                reservation.getCancelledAt(),
                reservation.getCheckedInAt(),
                reservation.getCompletedAt()
        );
    }

    private String nextCode() {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return "RES-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
