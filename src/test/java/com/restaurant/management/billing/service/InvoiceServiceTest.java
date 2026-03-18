package com.restaurant.management.billing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.restaurant.management.billing.domain.Invoice;
import com.restaurant.management.billing.domain.InvoiceStatus;
import com.restaurant.management.billing.repository.InvoiceItemRepository;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.repository.OrderItemRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;

class InvoiceServiceTest {

    @Test
    void shouldReturnSummaryRowsWithoutLoadingNestedCollectionsForInvoiceList() {
        InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
        InvoiceItemRepository invoiceItemRepository = mock(InvoiceItemRepository.class);
        PaymentRepository paymentRepository = mock(PaymentRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);

        InvoiceService service = new InvoiceService(
                invoiceRepository,
                invoiceItemRepository,
                paymentRepository,
                orderRepository,
                orderItemRepository
        );

        OrderTicket order = new OrderTicket();
        ReflectionTestUtils.setField(order, "id", 11L);

        Invoice invoice = new Invoice();
        ReflectionTestUtils.setField(invoice, "id", 7L);
        invoice.setOrder(order);
        invoice.setInvoiceNumber("INV-001");
        invoice.setStatus(InvoiceStatus.OPEN);
        invoice.setSubtotal(new BigDecimal("50.00"));
        invoice.setServiceFee(new BigDecimal("5.00"));
        invoice.setVatAmount(new BigDecimal("4.00"));
        invoice.setDiscountAmount(BigDecimal.ZERO.setScale(2));
        invoice.setTotalAmount(new BigDecimal("59.00"));
        invoice.setPaidAmount(BigDecimal.ZERO.setScale(2));
        invoice.setIssuedAt(Instant.now());

        when(invoiceRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 20))))
                .thenReturn(new PageImpl<>(List.of(invoice), PageRequest.of(0, 20), 1));

        PageResponse<com.restaurant.management.billing.dto.InvoiceResponse> response = service.list(PageRequest.of(0, 20), null, null, null);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().getFirst().items()).isEmpty();
        assertThat(response.content().getFirst().payments()).isEmpty();
        verifyNoInteractions(invoiceItemRepository, paymentRepository);
    }
}

