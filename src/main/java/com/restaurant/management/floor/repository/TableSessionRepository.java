package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableSessionStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableSessionRepository extends JpaRepository<TableSession, Long> {

    Optional<TableSession> findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(Long diningTableId, TableSessionStatus status);
}
