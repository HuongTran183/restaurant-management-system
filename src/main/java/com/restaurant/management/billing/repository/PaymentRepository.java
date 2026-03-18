package com.restaurant.management.billing.repository;

import com.restaurant.management.billing.domain.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PaymentRepository extends JpaRepository<Payment, Long>, JpaSpecificationExecutor<Payment> {

    List<Payment> findAllByInvoiceIdOrderByIdAsc(Long invoiceId);
}
