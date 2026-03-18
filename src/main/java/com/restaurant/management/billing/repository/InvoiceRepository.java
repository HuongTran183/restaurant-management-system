package com.restaurant.management.billing.repository;

import com.restaurant.management.billing.domain.Invoice;
import com.restaurant.management.billing.domain.InvoiceStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    boolean existsByOrderTableSessionIdAndStatus(Long tableSessionId, InvoiceStatus status);
}
