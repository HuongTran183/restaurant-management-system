package com.restaurant.management.floor.service;

import com.restaurant.management.billing.domain.InvoiceStatus;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.dto.OpenTableSessionRequest;
import com.restaurant.management.floor.dto.TableSessionResponse;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TableSessionService {

    private final TableSessionRepository tableSessionRepository;
    private final DiningTableService diningTableService;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TableSessionService(
            TableSessionRepository tableSessionRepository,
            DiningTableService diningTableService,
            OrderRepository orderRepository,
            InvoiceRepository invoiceRepository
    ) {
        this.tableSessionRepository = tableSessionRepository;
        this.diningTableService = diningTableService;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public TableSessionResponse get(Long sessionId) {
        return toResponse(findSession(sessionId));
    }

    @Transactional
    public TableSessionResponse open(OpenTableSessionRequest request) {
        DiningTable diningTable = diningTableService.findTable(request.diningTableId());
        tableSessionRepository.findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(diningTable.getId(), TableSessionStatus.OPEN)
                .ifPresent(existing -> {
                    throw new BusinessConflictException("There is already an open session for table: " + diningTable.getCode());
                });

        if (diningTable.getStatus() == TableStatus.CLEANING || diningTable.getStatus() == TableStatus.LOCKED) {
            throw new BusinessConflictException("Table is not available for service: " + diningTable.getCode());
        }

        diningTable.setStatus(TableStatus.OCCUPIED);
        TableSession tableSession = new TableSession();
        tableSession.setDiningTable(diningTable);
        tableSession.setSessionCode(nextSessionCode());
        tableSession.setStatus(TableSessionStatus.OPEN);
        tableSession.setOpenedAt(Instant.now());
        return toResponse(tableSessionRepository.save(tableSession));
    }

    @Transactional
    public TableSessionResponse close(Long sessionId) {
        TableSession tableSession = findSession(sessionId);
        if (tableSession.getStatus() != TableSessionStatus.OPEN) {
            throw new BusinessConflictException("Table session is already closed: " + tableSession.getSessionCode());
        }

        if (orderRepository.existsByTableSessionIdAndStatusIn(
                tableSession.getId(),
                List.of(OrderStatus.DRAFT, OrderStatus.CONFIRMED)
        )) {
            throw new BusinessConflictException("Cannot close table session while orders are still active");
        }

        if (invoiceRepository.existsByOrderTableSessionIdAndStatus(tableSession.getId(), InvoiceStatus.OPEN)) {
            throw new BusinessConflictException("Cannot close table session while invoices are still unpaid");
        }

        tableSession.setStatus(TableSessionStatus.CLOSED);
        tableSession.setClosedAt(Instant.now());
        tableSession.getDiningTable().setStatus(TableStatus.AVAILABLE);
        return toResponse(tableSession);
    }

    public TableSession findOpenSession(Long sessionId) {
        TableSession tableSession = findSession(sessionId);
        if (tableSession.getStatus() != TableSessionStatus.OPEN) {
            throw new BusinessConflictException("Table session is not open: " + tableSession.getSessionCode());
        }
        return tableSession;
    }

    private TableSession findSession(Long sessionId) {
        return tableSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Table session not found: " + sessionId));
    }

    private TableSessionResponse toResponse(TableSession tableSession) {
        return new TableSessionResponse(
                tableSession.getId(),
                tableSession.getSessionCode(),
                tableSession.getDiningTable().getId(),
                tableSession.getDiningTable().getCode(),
                tableSession.getDiningTable().getName(),
                tableSession.getStatus(),
                tableSession.getOpenedAt(),
                tableSession.getClosedAt()
        );
    }

    private String nextSessionCode() {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return "TS-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}
