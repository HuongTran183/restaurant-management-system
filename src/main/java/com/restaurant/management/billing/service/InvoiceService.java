package com.restaurant.management.billing.service;

import com.restaurant.management.billing.domain.Invoice;
import com.restaurant.management.billing.domain.InvoiceItem;
import com.restaurant.management.billing.domain.InvoiceStatus;
import com.restaurant.management.billing.dto.CreateInvoiceRequest;
import com.restaurant.management.billing.dto.InvoiceItemResponse;
import com.restaurant.management.billing.dto.InvoiceResponse;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.repository.InvoiceItemRepository;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.repository.OrderItemRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            InvoiceItemRepository invoiceItemRepository,
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> list(PageRequest pageRequest, InvoiceStatus status, Long orderId, String query) {
        Specification<Invoice> specification = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (status != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }
        if (orderId != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("order").get("id"), orderId));
        }
        if (hasText(query)) {
            String normalized = like(query);
            specification = specification.and((root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("order").get("orderCode")), normalized)
            ));
        }
        return PageResponse.from(invoiceRepository.findAll(specification, pageRequest).map(this::toSummaryResponse));
    }

    @Transactional(readOnly = true)
    public InvoiceResponse get(Long invoiceId) {
        return toResponse(findInvoice(invoiceId));
    }

    @Transactional
    public InvoiceResponse create(CreateInvoiceRequest request) {
        OrderTicket order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.orderId()));
        if (order.getStatus() == OrderStatus.DRAFT || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessConflictException("Only confirmed or completed orders can be invoiced");
        }
        if (invoiceRepository.existsByOrderId(order.getId())) {
            throw new BusinessConflictException("An invoice already exists for order: " + order.getOrderCode());
        }

        List<OrderItem> orderItems = orderItemRepository.findAllByOrderIdOrderByIdAsc(order.getId()).stream()
                .filter(orderItem -> orderItem.getStatus().isBillable())
                .toList();
        if (orderItems.isEmpty()) {
            throw new BusinessConflictException("Cannot create an invoice for an order without billable items");
        }

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setInvoiceNumber(nextInvoiceNumber());
        invoice.setStatus(InvoiceStatus.OPEN);
        invoice.setSubtotal(order.getSubtotal());
        invoice.setServiceFee(order.getServiceFee());
        invoice.setVatAmount(order.getVatAmount());
        invoice.setDiscountAmount(order.getDiscountAmount());
        invoice.setTotalAmount(order.getTotalAmount());
        invoice.setPaidAmount(BigDecimal.ZERO.setScale(2));
        invoice.setIssuedAt(Instant.now());
        Invoice savedInvoice = invoiceRepository.save(invoice);

        for (OrderItem orderItem : orderItems) {
            InvoiceItem invoiceItem = new InvoiceItem();
            invoiceItem.setInvoice(savedInvoice);
            invoiceItem.setOrderItem(orderItem);
            invoiceItem.setItemNameSnapshot(orderItem.getItemNameSnapshot());
            invoiceItem.setQuantity(orderItem.getQuantity());
            invoiceItem.setUnitPrice(orderItem.getUnitPrice());
            invoiceItem.setLineTotal(orderItem.getLineTotal());
            invoiceItemRepository.save(invoiceItem);
        }

        return toResponse(savedInvoice);
    }

    public Invoice findInvoice(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceItemResponse> items = invoiceItemRepository.findAllByInvoiceIdOrderByIdAsc(invoice.getId()).stream()
                .map(item -> new InvoiceItemResponse(
                        item.getId(),
                        item.getOrderItem() == null ? null : item.getOrderItem().getId(),
                        item.getItemNameSnapshot(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()
                ))
                .toList();
        List<PaymentResponse> payments = paymentRepository.findAllByInvoiceIdOrderByIdAsc(invoice.getId()).stream()
                .map(payment -> new PaymentResponse(
                        payment.getId(),
                        payment.getPaymentCode(),
                        invoice.getId(),
                        payment.getMethod(),
                        payment.getStatus(),
                        payment.getAmount(),
                        payment.getPaidAt(),
                        payment.getNote()
                ))
                .toList();
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getOrder().getId(),
                invoice.getStatus(),
                invoice.getSubtotal(),
                invoice.getServiceFee(),
                invoice.getVatAmount(),
                invoice.getDiscountAmount(),
                invoice.getTotalAmount(),
                invoice.getPaidAmount(),
                invoice.getIssuedAt(),
                invoice.getClosedAt(),
                items,
                payments
        );
    }

    private InvoiceResponse toSummaryResponse(Invoice invoice) {
        return new InvoiceResponse(
                invoice.getId(),
                invoice.getInvoiceNumber(),
                invoice.getOrder().getId(),
                invoice.getStatus(),
                invoice.getSubtotal(),
                invoice.getServiceFee(),
                invoice.getVatAmount(),
                invoice.getDiscountAmount(),
                invoice.getTotalAmount(),
                invoice.getPaidAmount(),
                invoice.getIssuedAt(),
                invoice.getClosedAt(),
                List.of(),
                List.of()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }

    private String nextInvoiceNumber() {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return "INV-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}
