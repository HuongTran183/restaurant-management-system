package com.restaurant.management.identity.repository;

import com.restaurant.management.identity.domain.LoginHistory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    Optional<LoginHistory> findFirstBySessionIdOrderByIdDesc(String sessionId);
}
