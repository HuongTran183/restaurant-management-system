ALTER TABLE orders
    ADD COLUMN source_channel VARCHAR(32) NOT NULL DEFAULT 'STAFF' AFTER order_type;

CREATE INDEX idx_orders_source_channel ON orders (source_channel);

CREATE TABLE reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_code VARCHAR(80) NOT NULL UNIQUE,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(160) NULL,
    party_size INT NOT NULL,
    reservation_time DATETIME(6) NOT NULL,
    status VARCHAR(32) NOT NULL,
    requested_area VARCHAR(120) NULL,
    assigned_table_id BIGINT NULL,
    note VARCHAR(500) NULL,
    internal_note VARCHAR(500) NULL,
    confirmed_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    checked_in_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_reservations_assigned_table FOREIGN KEY (assigned_table_id) REFERENCES dining_tables (id)
);

CREATE TABLE reservation_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT NOT NULL,
    from_status VARCHAR(32) NULL,
    to_status VARCHAR(32) NOT NULL,
    note VARCHAR(255) NULL,
    changed_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_reservation_histories_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id)
);

CREATE INDEX idx_reservations_status_time ON reservations (status, reservation_time);
CREATE INDEX idx_reservations_phone ON reservations (phone);
