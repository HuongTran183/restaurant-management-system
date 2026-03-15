package com.restaurant.management.identity.service;

import com.restaurant.management.identity.domain.AuditLog;
import com.restaurant.management.identity.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void recordSystem(String action, String targetType, String targetId, String details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setTargetType(targetType);
        auditLog.setTargetId(targetId);
        auditLog.setActorUsername("system");
        auditLog.setDetails(details);
        auditLogRepository.save(auditLog);
    }
}
