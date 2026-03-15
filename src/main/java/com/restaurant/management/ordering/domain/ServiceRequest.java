package com.restaurant.management.ordering.domain;

import com.restaurant.management.common.model.AuditableEntity;
import com.restaurant.management.floor.domain.TableSession;
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
@Table(name = "service_requests")
public class ServiceRequest extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_session_id")
    private TableSession tableSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderTicket order;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 32)
    private ServiceRequestType requestType;

    @Column(length = 255)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ServiceRequestStatus status = ServiceRequestStatus.OPEN;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant resolvedAt;

    public TableSession getTableSession() {
        return tableSession;
    }

    public void setTableSession(TableSession tableSession) {
        this.tableSession = tableSession;
    }

    public OrderTicket getOrder() {
        return order;
    }

    public void setOrder(OrderTicket order) {
        this.order = order;
    }

    public ServiceRequestType getRequestType() {
        return requestType;
    }

    public void setRequestType(ServiceRequestType requestType) {
        this.requestType = requestType;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public ServiceRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceRequestStatus status) {
        this.status = status;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
