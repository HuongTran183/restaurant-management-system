package com.restaurant.management.reservation.scheduler;

import com.restaurant.management.common.websocket.WebSocketEvent;
import com.restaurant.management.common.websocket.WebSocketEventPublisher;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.reservation.domain.Reservation;
import com.restaurant.management.reservation.domain.ReservationHistory;
import com.restaurant.management.reservation.domain.ReservationStatus;
import com.restaurant.management.reservation.repository.ReservationHistoryRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReservationAutoExpireScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationAutoExpireScheduler.class);
    private static final Duration GRACE_PERIOD = Duration.ofMinutes(15);

    private final ReservationRepository reservationRepository;
    private final ReservationHistoryRepository reservationHistoryRepository;
    private final TableSessionRepository tableSessionRepository;
    private final WebSocketEventPublisher webSocketEventPublisher;

    public ReservationAutoExpireScheduler(
            ReservationRepository reservationRepository,
            ReservationHistoryRepository reservationHistoryRepository,
            TableSessionRepository tableSessionRepository,
            WebSocketEventPublisher webSocketEventPublisher
    ) {
        this.reservationRepository = reservationRepository;
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.tableSessionRepository = tableSessionRepository;
        this.webSocketEventPublisher = webSocketEventPublisher;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expireOverdueReservations() {
        Instant now = Instant.now();
        Instant cutoff = now.minus(GRACE_PERIOD);

        List<Reservation> overdueReservations = reservationRepository
                .findAllByStatusInAndReservationTimeBefore(
                        Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                        cutoff
                );

        if (overdueReservations.isEmpty()) {
            return;
        }

        log.info("Auto-expiring {} overdue reservation(s)", overdueReservations.size());

        for (Reservation reservation : overdueReservations) {
            ReservationStatus previousStatus = reservation.getStatus();
            reservation.setStatus(ReservationStatus.CANCELLED);
            reservation.setCancelledAt(now);

            if (reservation.getAssignedTable() != null) {
                releaseTableIfIdle(reservation);
            }

            ReservationHistory history = new ReservationHistory();
            history.setReservation(reservation);
            history.setFromStatus(previousStatus);
            history.setToStatus(ReservationStatus.CANCELLED);
            history.setNote("Auto-cancelled: customer did not arrive within 15 minutes of reservation time");
            history.setChangedAt(now);
            reservationHistoryRepository.save(history);

            log.info("Auto-expired reservation {} (code={})", reservation.getId(), reservation.getReservationCode());
            webSocketEventPublisher.publishReservationEvent(WebSocketEvent.of("RESERVATION_AUTO_CANCELLED", reservation.getId(), reservation.getReservationCode(), null));
        }
    }

    private void releaseTableIfIdle(Reservation reservation) {
        var table = reservation.getAssignedTable();
        boolean hasOpenSession = tableSessionRepository
                .findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(table.getId(), TableSessionStatus.OPEN)
                .isPresent();
        if (!hasOpenSession) {
            table.setStatus(TableStatus.AVAILABLE);
        }
    }
}
