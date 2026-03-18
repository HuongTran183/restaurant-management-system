package com.restaurant.management.reservation.repository;

import com.restaurant.management.reservation.domain.ReservationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationHistoryRepository extends JpaRepository<ReservationHistory, Long> {
}
