package com.restaurant.management.identity.repository;

import com.restaurant.management.identity.domain.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
}
