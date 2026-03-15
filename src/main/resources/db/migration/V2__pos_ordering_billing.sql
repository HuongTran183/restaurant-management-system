CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NULL,
    email VARCHAR(160) NULL,
    active BIT(1) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL
);

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(80) NOT NULL UNIQUE,
    table_session_id BIGINT NULL,
    customer_id BIGINT NULL,
    order_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    note VARCHAR(500) NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    service_fee DECIMAL(12, 2) NOT NULL,
    vat_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_requested BIT(1) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_orders_table_session FOREIGN KEY (table_session_id) REFERENCES table_sessions (id),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    item_name_snapshot VARCHAR(160) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    note VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_order_items_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
);

CREATE TABLE order_item_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    option_name_snapshot VARCHAR(120) NOT NULL,
    option_value_snapshot VARCHAR(120) NOT NULL,
    price_adjustment DECIMAL(12, 2) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_order_item_options_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
);

CREATE TABLE order_histories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    from_status VARCHAR(32) NULL,
    to_status VARCHAR(32) NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_order_histories_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE service_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_session_id BIGINT NULL,
    order_id BIGINT NULL,
    request_type VARCHAR(32) NOT NULL,
    note VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL,
    requested_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_service_requests_session FOREIGN KEY (table_session_id) REFERENCES table_sessions (id),
    CONSTRAINT fk_service_requests_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    invoice_number VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    service_fee DECIMAL(12, 2) NOT NULL,
    vat_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) NOT NULL,
    issued_at DATETIME(6) NOT NULL,
    closed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    order_item_id BIGINT NULL,
    item_name_snapshot VARCHAR(160) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    CONSTRAINT fk_invoice_items_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
);

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    payment_code VARCHAR(80) NOT NULL UNIQUE,
    method VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    paid_at DATETIME(6) NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

CREATE INDEX idx_orders_table_session ON orders (table_session_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_service_requests_status ON service_requests (status);
CREATE INDEX idx_payments_invoice ON payments (invoice_id);
