package com.restaurant.management.billing.repository;

import com.restaurant.management.billing.domain.InvoiceItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, Long> {

    List<InvoiceItem> findAllByInvoiceIdOrderByIdAsc(Long invoiceId);
}
