package com.restaurant.management.floor.domain;

import com.restaurant.management.common.model.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "table_qrs")
public class TableQr extends AuditableEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dining_table_id", nullable = false, unique = true)
    private DiningTable diningTable;

    @Column(nullable = false, unique = true, length = 160)
    private String token;

    @Column(nullable = false, length = 120)
    private String label;

    @Column(length = 255)
    private String imagePath;

    private Instant expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    public DiningTable getDiningTable() {
        return diningTable;
    }

    public void setDiningTable(DiningTable diningTable) {
        this.diningTable = diningTable;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
