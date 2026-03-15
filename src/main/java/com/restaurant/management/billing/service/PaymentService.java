package com.restaurant.management.billing.service;

import com.restaurant.management.billing.domain.Invoice;
import com.restaurant.management.billing.domain.Payment;
import com.restaurant.management.billing.domain.PaymentStatus;
import com.restaurant.management.billing.dto.PaymentRequest;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.ordering.service.OrderWorkflowService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
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
            invoice.setStatus(com.restaurant.management.billing.domain.InvoiceStatus.PAID);
            invoice.setClosedAt(Instant.now());
            orderWorkflowService.completeAfterPayment(invoice.getOrder().getId());
        }

        return new PaymentResponse(
                savedPayment.getId(),
                savedPayment.getPaymentCode(),
                invoice.getId(),
                savedPayment.getMethod(),
                savedPayment.getStatus(),
                savedPayment.getAmount(),
                savedPayment.getPaidAt(),
                savedPayment.getNote()
        );
    }

    private String nextPaymentCode() {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return "PAY-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}
