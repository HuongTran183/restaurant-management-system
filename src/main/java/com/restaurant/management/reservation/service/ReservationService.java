package com.restaurant.management.reservation.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.common.websocket.WebSocketEvent;
import com.restaurant.management.common.websocket.WebSocketEventPublisher;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.AreaRepository;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.floor.service.DiningTableService;
import com.restaurant.management.reservation.domain.Reservation;
import com.restaurant.management.reservation.domain.ReservationHistory;
import com.restaurant.management.reservation.domain.ReservationStatus;
import com.restaurant.management.reservation.dto.PublicBookingAreaResponse;
import com.restaurant.management.reservation.dto.PublicBookingOptionsResponse;
import com.restaurant.management.reservation.dto.PublicBookingTableResponse;
import com.restaurant.management.reservation.dto.PublicReservationResponse;
import com.restaurant.management.reservation.dto.ReservationRequest;
import com.restaurant.management.reservation.dto.ReservationResponse;
import com.restaurant.management.reservation.dto.PublicReservationSearchResponse;
import com.restaurant.management.reservation.repository.ReservationHistoryRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final Duration PUBLIC_BOOKING_HOLD_WINDOW = Duration.ofHours(2);

    private final ReservationRepository reservationRepository;
    private final ReservationHistoryRepository reservationHistoryRepository;
    private final DiningTableService diningTableService;
    private final TableSessionRepository tableSessionRepository;
    private final AreaRepository areaRepository;
    private final DiningTableRepository diningTableRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;
    private final SecureRandom secureRandom = new SecureRandom();

    public ReservationService(
            ReservationRepository reservationRepository,
            ReservationHistoryRepository reservationHistoryRepository,
            DiningTableService diningTableService,
            TableSessionRepository tableSessionRepository,
            AreaRepository areaRepository,
            DiningTableRepository diningTableRepository,
            WebSocketEventPublisher webSocketEventPublisher
    ) {
        this.reservationRepository = reservationRepository;
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.diningTableService = diningTableService;
        this.tableSessionRepository = tableSessionRepository;
        this.areaRepository = areaRepository;
        this.diningTableRepository = diningTableRepository;
        this.webSocketEventPublisher = webSocketEventPublisher;
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

    @Transactional(readOnly = true)
    public PublicReservationSearchResponse lookupPublic(String query) {
        String normalizedQuery = normalizeLookupValue(query);
        if (normalizedQuery.startsWith("RES-")) {
            return new PublicReservationSearchResponse(
                    "CODE",
                    List.of(toPublicResponse(findByCode(normalizedQuery)))
            );
        }

        List<PublicReservationResponse> matches = reservationRepository.findAll().stream()
                .filter(reservation -> normalizedPhone(reservation.getPhone()).equals(normalizedPhone(query)))
                .sorted(Comparator.comparing(Reservation::getReservationTime).reversed())
                .map(this::toPublicResponse)
                .toList();

        if (matches.isEmpty()) {
            throw new ResourceNotFoundException("Reservation not found: " + query);
        }

        return new PublicReservationSearchResponse("PHONE", matches);
    }

    @Transactional(readOnly = true)
    public PublicBookingOptionsResponse getPublicBookingOptions(Instant reservationTime, int partySize) {
        List<Area> areas = areaRepository.findAllByActiveTrueOrderByNameAsc();
        List<DiningTable> tables = diningTableRepository.findAllByActiveTrueOrderByArea_NameAscNameAsc();
        Map<Long, List<DiningTable>> tablesByAreaId = tables.stream()
                .collect(Collectors.groupingBy(table -> table.getArea().getId()));

        List<PublicBookingAreaResponse> areaResponses = areas.stream()
                .map(area -> toPublicBookingArea(area, tablesByAreaId.getOrDefault(area.getId(), List.of()), reservationTime, partySize))
                .toList();

        return new PublicBookingOptionsResponse(reservationTime, partySize, areaResponses);
    }

    @Transactional
    public ReservationResponse create(ReservationRequest request) {
        Reservation reservation = new Reservation();
        reservation.setReservationCode(nextCode());
        applyRequest(reservation, request);
        Reservation saved = reservationRepository.save(reservation);
        recordHistory(saved, null, ReservationStatus.PENDING, "Reservation created");
        ReservationResponse response = toResponse(saved);
        webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_CREATED", saved.getId(), saved.getReservationCode(), response));
        return response;
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
        ReservationResponse response = toResponse(reservation);
        webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_CONFIRMED", reservation.getId(), reservation.getReservationCode(), response));
        return response;
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
    public PublicReservationResponse reschedulePublicByCode(String reservationCode, String phone, Instant reservationTime) {
        Reservation reservation = findPublicReservation(reservationCode, phone);
        if (reservation.getStatus() == ReservationStatus.CANCELLED || reservation.getStatus() == ReservationStatus.COMPLETED) {
            throw new BusinessConflictException("Reservation is already closed");
        }
        if (reservation.getStatus() == ReservationStatus.CHECKED_IN) {
            throw new BusinessConflictException("Checked-in reservations cannot be rescheduled");
        }

        Instant previousTime = reservation.getReservationTime();
        DiningTable assignedTable = reservation.getAssignedTable();
        reservation.setReservationTime(reservationTime);

        if (assignedTable != null && !canKeepAssignedTable(assignedTable, reservation, reservationTime)) {
            releaseDiningTableIfIdle(assignedTable);
            reservation.setAssignedTable(null);
        } else if (assignedTable != null) {
            assignedTable.setStatus(TableStatus.RESERVED);
        }

        recordHistory(
                reservation,
                reservation.getStatus(),
                reservation.getStatus(),
                "Reservation rescheduled from " + previousTime + " to " + reservationTime
        );
        return toPublicResponse(reservation);
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
        ReservationResponse response = toResponse(reservation);
        webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_CHECKED_IN", reservation.getId(), reservation.getReservationCode(), response));
        return response;
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
        ReservationResponse response = toResponse(reservation);
        webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_COMPLETED", reservation.getId(), reservation.getReservationCode(), response));
        return response;
    }

    public Reservation findReservation(Long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));
    }

    private Reservation findByCode(String reservationCode) {
        return reservationRepository.findByReservationCodeIgnoreCase(reservationCode)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationCode));
    }

    private Reservation findPublicReservation(String reservationCode, String phone) {
        Reservation reservation = findByCode(reservationCode);
        if (!normalizedPhone(reservation.getPhone()).equals(normalizedPhone(phone))) {
            throw new ResourceNotFoundException("Reservation not found: " + reservationCode);
        }
        return reservation;
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
        DiningTable selectedTable = resolveSelectedTable(request.selectedTableId(), request.partySize(), request.reservationTime());
        reservation.setAssignedTable(selectedTable);
        if (selectedTable != null) {
            selectedTable.setStatus(TableStatus.RESERVED);
        }
        reservation.setRequestedArea(resolveRequestedArea(request.requestedArea(), selectedTable));
        reservation.setNote(isBlank(request.note()) ? null : request.note().trim());
    }

    private String resolveRequestedArea(String requestedArea, DiningTable selectedTable) {
        if (selectedTable != null) {
            return selectedTable.getArea().getName();
        }
        return isBlank(requestedArea) ? null : requestedArea.trim();
    }

    private DiningTable resolveSelectedTable(Long selectedTableId, int partySize, Instant reservationTime) {
        if (selectedTableId == null) {
            return null;
        }
        DiningTable diningTable = diningTableService.findTable(selectedTableId);
        if (!isTableSelectable(diningTable, reservationTime, partySize)) {
            throw new BusinessConflictException("Selected table is no longer available: " + diningTable.getCode());
        }
        return diningTable;
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
        webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_CANCELLED", reservation.getId(), reservation.getReservationCode(), null));
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
        releaseDiningTableIfIdle(reservation.getAssignedTable());
    }

    private PublicBookingAreaResponse toPublicBookingArea(Area area, List<DiningTable> tables, Instant reservationTime, int partySize) {
        List<PublicBookingTableResponse> tableResponses = tables.stream()
                .sorted(Comparator.comparing(DiningTable::getName, String.CASE_INSENSITIVE_ORDER))
                .map(table -> toPublicBookingTable(table, reservationTime, partySize))
                .toList();
        int availableTables = (int) tableResponses.stream().filter(PublicBookingTableResponse::selectable).count();
        int totalTables = tableResponses.size();
        return new PublicBookingAreaResponse(
                area.getId(),
                area.getCode(),
                area.getName(),
                area.getDescription(),
                totalTables,
                availableTables,
                totalTables - availableTables,
                tableResponses
        );
    }

    private PublicBookingTableResponse toPublicBookingTable(DiningTable diningTable, Instant reservationTime, int partySize) {
        boolean selectable = isTableSelectable(diningTable, reservationTime, partySize);
        return new PublicBookingTableResponse(
                diningTable.getId(),
                diningTable.getCode(),
                diningTable.getName(),
                diningTable.getSeatCount(),
                diningTable.getArea().getId(),
                diningTable.getArea().getName(),
                selectable ? "AVAILABLE" : "BOOKED",
                selectable
        );
    }

    private boolean isTableSelectable(DiningTable diningTable, Instant reservationTime, int partySize) {
        if (!diningTable.isActive() || diningTable.getSeatCount() < partySize) {
            return false;
        }
        if (diningTable.getStatus() != TableStatus.AVAILABLE) {
            return false;
        }
        if (tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(diningTable.getId(), TableSessionStatus.OPEN).isPresent()) {
            return false;
        }
        return !hasConflictingReservation(diningTable, reservationTime);
    }

    private boolean canKeepAssignedTable(DiningTable diningTable, Reservation reservation, Instant reservationTime) {
        if (!diningTable.isActive() || diningTable.getSeatCount() < reservation.getPartySize()) {
            return false;
        }
        if (diningTable.getStatus() == TableStatus.CLEANING || diningTable.getStatus() == TableStatus.LOCKED || diningTable.getStatus() == TableStatus.OCCUPIED) {
            return false;
        }
        if (tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(diningTable.getId(), TableSessionStatus.OPEN).isPresent()) {
            return false;
        }
        return !hasConflictingReservation(diningTable, reservationTime, reservation.getId());
    }

    private boolean hasConflictingReservation(DiningTable diningTable, Instant reservationTime) {
        return hasConflictingReservation(diningTable, reservationTime, null);
    }

    private boolean hasConflictingReservation(DiningTable diningTable, Instant reservationTime, Long excludedReservationId) {
        Instant windowStart = reservationTime.minus(PUBLIC_BOOKING_HOLD_WINDOW);
        Instant windowEnd = reservationTime.plus(PUBLIC_BOOKING_HOLD_WINDOW);
        return reservationRepository.findAllByStatusInAndAssignedTableIsNotNull(activeReservationStatuses()).stream()
                .filter(reservation -> reservation.getAssignedTable() != null)
                .filter(reservation -> excludedReservationId == null || !reservation.getId().equals(excludedReservationId))
                .filter(reservation -> reservation.getAssignedTable().getId().equals(diningTable.getId()))
                .anyMatch(reservation -> !reservation.getReservationTime().isBefore(windowStart) && !reservation.getReservationTime().isAfter(windowEnd));
    }

    private void releaseDiningTableIfIdle(DiningTable diningTable) {
        boolean hasOpenSession = tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(
                diningTable.getId(),
                TableSessionStatus.OPEN
        ).isPresent();
        if (!hasOpenSession) {
            diningTable.setStatus(TableStatus.AVAILABLE);
        }
    }

    private Set<ReservationStatus> activeReservationStatuses() {
        return Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN);
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

    private String normalizeLookupValue(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase();
    }

    private String normalizedPhone(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[^0-9+]", "");
    }
}
