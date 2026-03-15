package com.restaurant.management.floor.domain;

import com.restaurant.management.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "table_sessions")
public class TableSession extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dining_table_id", nullable = false)
    private DiningTable diningTable;

    @Column(nullable = false, unique = true, length = 60)
    private String sessionCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private TableSessionStatus status = TableSessionStatus.OPEN;

    @Column(nullable = false)
    private Instant openedAt;

    private Instant closedAt;

    public DiningTable getDiningTable() {
        return diningTable;
    }

    public void setDiningTable(DiningTable diningTable) {
        this.diningTable = diningTable;
    }

    public String getSessionCode() {
        return sessionCode;
    }

    public void setSessionCode(String sessionCode) {
        this.sessionCode = sessionCode;
    }

    public TableSessionStatus getStatus() {
        return status;
    }

    public void setStatus(TableSessionStatus status) {
        this.status = status;
    }

    public Instant getOpenedAt() {
        return openedAt;
    }

    public void setOpenedAt(Instant openedAt) {
        this.openedAt = openedAt;
    }

    public Instant getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(Instant closedAt) {
        this.closedAt = closedAt;
    }
}
