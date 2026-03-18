package com.restaurant.management.billing.service;

import com.restaurant.management.billing.domain.Invoice;
import com.restaurant.management.billing.domain.InvoiceStatus;
import com.restaurant.management.billing.domain.Payment;
import com.restaurant.management.billing.domain.PaymentMethod;
import com.restaurant.management.billing.domain.PaymentStatus;
import com.restaurant.management.billing.dto.PaymentRequest;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.ordering.service.OrderWorkflowService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final OrderWorkflowService orderWorkflowService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PaymentService(
            InvoiceRepository invoiceRepository,
            PaymentRepository paymentRepository,
            OrderWorkflowService orderWorkflowService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.orderWorkflowService = orderWorkflowService;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> list(PageRequest pageRequest, Long invoiceId, PaymentMethod method, String query) {
        Specification<Payment> specification = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (invoiceId != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("invoice").get("id"), invoiceId));
        }
        if (method != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("method"), method));
        }
        if (hasText(query)) {
            String normalized = like(query);
            specification = specification.and((root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("paymentCode")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("note")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("invoice").get("invoiceNumber")), normalized)
            ));
        }
        return PageResponse.from(paymentRepository.findAll(specification, pageRequest).map(this::toResponse));
    }

    @Transactional
    public PaymentResponse record(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.invoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.invoiceId()));
        if (!invoice.getStatus().isOpen()) {
            throw new BusinessConflictException("Payments can only be recorded for open invoices");
        }

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal newPaidAmount = invoice.getPaidAmount().add(amount);
        if (newPaidAmount.compareTo(invoice.getTotalAmount()) > 0) {
            throw new BusinessConflictException("Payment amount exceeds the remaining invoice balance");
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setPaymentCode(nextPaymentCode());
        payment.setMethod(request.method());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setAmount(amount);
        payment.setPaidAt(Instant.now());
        payment.setNote(request.note());
        Payment savedPayment = paymentRepository.save(payment);

        invoice.setPaidAmount(newPaidAmount);
        if (newPaidAmount.compareTo(invoice.getTotalAmount()) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setClosedAt(Instant.now());
            orderWorkflowService.completeAfterPayment(invoice.getOrder().getId());
        }

        return toResponse(savedPayment);
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentCode(),
                payment.getInvoice().getId(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getAmount(),
                payment.getPaidAt(),
                payment.getNote()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }

    private String nextPaymentCode() {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return "PAY-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}
