package com.restaurant.management.billing.repository;

import com.restaurant.management.billing.domain.Payment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByInvoiceIdOrderByIdAsc(Long invoiceId);
}
