package com.restaurant.management.reservation.repository;

import com.restaurant.management.reservation.domain.Reservation;
import com.restaurant.management.reservation.domain.ReservationStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {

    @EntityGraph(attributePaths = {"assignedTable", "assignedTable.area"})
    List<Reservation> findAllByStatusInAndAssignedTableIsNotNull(Collection<ReservationStatus> statuses);

    @EntityGraph(attributePaths = {"assignedTable", "assignedTable.area"})
    List<Reservation> findAllByStatusInAndReservationTimeBefore(Collection<ReservationStatus> statuses, Instant cutoff);

    Optional<Reservation> findByReservationCodeIgnoreCase(String reservationCode);
}
