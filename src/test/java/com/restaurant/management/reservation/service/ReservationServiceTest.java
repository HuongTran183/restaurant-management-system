package com.restaurant.management.reservation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurant.management.common.websocket.WebSocketEventPublisher;
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
import com.restaurant.management.reservation.dto.ReservationResponse;
import com.restaurant.management.reservation.repository.ReservationHistoryRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ReservationServiceTest {

    @Test
    void shouldCheckInConfirmedReservationAndOccupyTable() {
        ReservationRepository reservationRepository = mock(ReservationRepository.class);
        ReservationHistoryRepository reservationHistoryRepository = mock(ReservationHistoryRepository.class);
        DiningTableService diningTableService = mock(DiningTableService.class);
        TableSessionRepository tableSessionRepository = mock(TableSessionRepository.class);
        AreaRepository areaRepository = mock(AreaRepository.class);
        DiningTableRepository diningTableRepository = mock(DiningTableRepository.class);
        WebSocketEventPublisher webSocketEventPublisher = mock(WebSocketEventPublisher.class);

        ReservationService service = new ReservationService(
                reservationRepository,
                reservationHistoryRepository,
                diningTableService,
                tableSessionRepository,
                areaRepository,
                diningTableRepository,
                webSocketEventPublisher
        );

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", 1L);
        reservation.setReservationCode("RES-001");
        reservation.setCustomerName("Nguyen Van A");
        reservation.setPhone("0901000100");
        reservation.setPartySize(4);
        reservation.setReservationTime(Instant.now().plusSeconds(3600));
        reservation.setStatus(ReservationStatus.CONFIRMED);

        DiningTable diningTable = new DiningTable();
        ReflectionTestUtils.setField(diningTable, "id", 5L);
        diningTable.setCode("T-05");
        diningTable.setName("Table 05");
        diningTable.setActive(true);
        diningTable.setStatus(TableStatus.AVAILABLE);

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(diningTableService.findTable(5L)).thenReturn(diningTable);
        when(tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(5L, TableSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        ReservationResponse response = service.checkIn(1L, 5L, "VIP guest");

        assertThat(response.status()).isEqualTo(ReservationStatus.CHECKED_IN);
        assertThat(response.assignedTableId()).isEqualTo(5L);
        assertThat(response.internalNote()).isEqualTo("VIP guest");
        assertThat(reservation.getCheckedInAt()).isNotNull();
        assertThat(diningTable.getStatus()).isEqualTo(TableStatus.OCCUPIED);
        verify(reservationHistoryRepository).save(argThat((ReservationHistory history) ->
                history.getFromStatus() == ReservationStatus.CONFIRMED
                        && history.getToStatus() == ReservationStatus.CHECKED_IN));
    }

    @Test
    void shouldCompleteCheckedInReservationAndReleaseIdleTable() {
        ReservationRepository reservationRepository = mock(ReservationRepository.class);
        ReservationHistoryRepository reservationHistoryRepository = mock(ReservationHistoryRepository.class);
        DiningTableService diningTableService = mock(DiningTableService.class);
        TableSessionRepository tableSessionRepository = mock(TableSessionRepository.class);
        AreaRepository areaRepository = mock(AreaRepository.class);
        DiningTableRepository diningTableRepository = mock(DiningTableRepository.class);
        WebSocketEventPublisher webSocketEventPublisher = mock(WebSocketEventPublisher.class);

        ReservationService service = new ReservationService(
                reservationRepository,
                reservationHistoryRepository,
                diningTableService,
                tableSessionRepository,
                areaRepository,
                diningTableRepository,
                webSocketEventPublisher
        );

        DiningTable diningTable = new DiningTable();
        ReflectionTestUtils.setField(diningTable, "id", 9L);
        diningTable.setCode("T-09");
        diningTable.setName("Table 09");
        diningTable.setActive(true);
        diningTable.setStatus(TableStatus.OCCUPIED);

        Reservation reservation = new Reservation();
        ReflectionTestUtils.setField(reservation, "id", 2L);
        reservation.setReservationCode("RES-002");
        reservation.setCustomerName("Tran Thi B");
        reservation.setPhone("0902000200");
        reservation.setPartySize(2);
        reservation.setReservationTime(Instant.now().plusSeconds(7200));
        reservation.setStatus(ReservationStatus.CHECKED_IN);
        reservation.setAssignedTable(diningTable);

        when(reservationRepository.findById(2L)).thenReturn(Optional.of(reservation));
        when(tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(9L, TableSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        ReservationResponse response = service.complete(2L);

        assertThat(response.status()).isEqualTo(ReservationStatus.COMPLETED);
        assertThat(reservation.getCompletedAt()).isNotNull();
        assertThat(diningTable.getStatus()).isEqualTo(TableStatus.AVAILABLE);
        verify(reservationHistoryRepository).save(argThat((ReservationHistory history) ->
                history.getFromStatus() == ReservationStatus.CHECKED_IN
                        && history.getToStatus() == ReservationStatus.COMPLETED));
    }
}
