package com.restaurant.management.bootstrap.service;

import com.restaurant.management.billing.domain.PaymentMethod;
import com.restaurant.management.billing.dto.CreateInvoiceRequest;
import com.restaurant.management.billing.dto.InvoiceResponse;
import com.restaurant.management.billing.dto.PaymentRequest;
import com.restaurant.management.billing.dto.PaymentResponse;
import com.restaurant.management.billing.repository.InvoiceItemRepository;
import com.restaurant.management.billing.repository.InvoiceRepository;
import com.restaurant.management.billing.repository.PaymentRepository;
import com.restaurant.management.billing.service.InvoiceService;
import com.restaurant.management.billing.service.PaymentService;
import com.restaurant.management.bootstrap.dto.DevResetResponse;
import com.restaurant.management.bootstrap.dto.DevScenarioResponse;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableStatus;
import com.restaurant.management.floor.repository.DiningTableRepository;
import com.restaurant.management.floor.repository.TableSessionRepository;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.identity.service.IdentityBootstrapService;
import com.restaurant.management.ordering.domain.OrderType;
import com.restaurant.management.ordering.domain.ServiceRequestType;
import com.restaurant.management.ordering.dto.AddOrderItemRequest;
import com.restaurant.management.ordering.dto.CreateOrderRequest;
import com.restaurant.management.ordering.dto.OrderResponse;
import com.restaurant.management.ordering.dto.ServiceRequestResponse;
import com.restaurant.management.ordering.repository.OrderHistoryRepository;
import com.restaurant.management.ordering.repository.OrderItemRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import com.restaurant.management.ordering.repository.ServiceRequestRepository;
import com.restaurant.management.ordering.service.OrderWorkflowService;
import com.restaurant.management.ordering.service.ServiceRequestService;
import com.restaurant.management.reservation.repository.ReservationHistoryRepository;
import com.restaurant.management.reservation.repository.ReservationRepository;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "test"})
@ConditionalOnProperty(prefix = "app.dev-support", name = "enabled", havingValue = "true")
public class DevSupportService {

    private final DemoEnvironmentService demoEnvironmentService;
    private final IdentityBootstrapService identityBootstrapService;
    private final DiningTableRepository diningTableRepository;
    private final TableSessionRepository tableSessionRepository;
    private final TableSessionService tableSessionService;
    private final ReservationRepository reservationRepository;
    private final ReservationHistoryRepository reservationHistoryRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final OrderWorkflowService orderWorkflowService;
    private final ServiceRequestService serviceRequestService;
    private final InvoiceService invoiceService;
    private final PaymentService paymentService;
    private final JdbcTemplate jdbcTemplate;

    public DevSupportService(
            DemoEnvironmentService demoEnvironmentService,
            IdentityBootstrapService identityBootstrapService,
            DiningTableRepository diningTableRepository,
            TableSessionRepository tableSessionRepository,
            TableSessionService tableSessionService,
            ReservationRepository reservationRepository,
            ReservationHistoryRepository reservationHistoryRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderHistoryRepository orderHistoryRepository,
            ServiceRequestRepository serviceRequestRepository,
            InvoiceRepository invoiceRepository,
            InvoiceItemRepository invoiceItemRepository,
            PaymentRepository paymentRepository,
            OrderWorkflowService orderWorkflowService,
            ServiceRequestService serviceRequestService,
            InvoiceService invoiceService,
            PaymentService paymentService,
            JdbcTemplate jdbcTemplate
    ) {
        this.demoEnvironmentService = demoEnvironmentService;
        this.identityBootstrapService = identityBootstrapService;
        this.diningTableRepository = diningTableRepository;
        this.tableSessionRepository = tableSessionRepository;
        this.tableSessionService = tableSessionService;
        this.reservationRepository = reservationRepository;
        this.reservationHistoryRepository = reservationHistoryRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
        this.paymentRepository = paymentRepository;
        this.orderWorkflowService = orderWorkflowService;
        this.serviceRequestService = serviceRequestService;
        this.invoiceService = invoiceService;
        this.paymentService = paymentService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public DevResetResponse reset() {
        clearTransientData();
        return new DevResetResponse("CLEARED", "Transient dining, billing, and reservation data cleared");
    }

    @Transactional
    public DevScenarioResponse baseline() {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = baselineInternal();
        return toScenarioResponse("baseline", snapshot, null, null, null);
    }

    @Transactional
    public DevScenarioResponse draftOrder() {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = baselineInternal();
        TableSession tableSession = tableSessionService.findOrOpenSessionByTableId(snapshot.table().getId());
        OrderResponse order = orderWorkflowService.create(new CreateOrderRequest(
                OrderType.DINE_IN,
                tableSession.getId(),
                null,
                "Dev support draft order seed"
        ));
        return toScenarioResponse("draft-order", snapshot, tableSession, order, null);
    }

    @Transactional
    public DevScenarioResponse pendingBill() {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = baselineInternal();
        TableSession tableSession = tableSessionService.findOrOpenSessionByTableId(snapshot.table().getId());
        OrderResponse order = orderWorkflowService.submitQrOrder(
                tableSession.getId(),
                "Dev support pending bill seed",
                List.of(new AddOrderItemRequest(snapshot.menuItem().getId(), 1, "Seeded from /api/dev"))
        );
        ServiceRequestResponse serviceRequest = serviceRequestService.createForSession(
                tableSession.getId(),
                order.id(),
                ServiceRequestType.REQUEST_BILL,
                "Dev support pending bill request"
        );
        return toScenarioResponse("pending-bill", snapshot, tableSession, order, serviceRequest);
    }

    @Transactional
    public DevScenarioResponse openInvoice() {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = baselineInternal();
        SeededOrder seededOrder = createConfirmedStaffOrder(snapshot, "Dev support open invoice seed", "Seeded open invoice item");
        InvoiceResponse invoice = invoiceService.create(new CreateInvoiceRequest(seededOrder.order().id()));
        return toScenarioResponse("open-invoice", snapshot, seededOrder.tableSession(), seededOrder.order(), null, invoice, null);
    }

    @Transactional
    public DevScenarioResponse paymentHistory() {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = baselineInternal();
        SeededOrder seededOrder = createConfirmedStaffOrder(snapshot, "Dev support payment history seed", "Seeded payment history item");
        InvoiceResponse invoice = invoiceService.create(new CreateInvoiceRequest(seededOrder.order().id()));
        PaymentResponse payment = paymentService.record(new PaymentRequest(
                invoice.id(),
                PaymentMethod.CASH,
                invoice.totalAmount(),
                "Dev support payment history seed"
        ));
        OrderResponse completedOrder = orderWorkflowService.get(seededOrder.order().id());
        InvoiceResponse paidInvoice = invoiceService.get(invoice.id());
        return toScenarioResponse("payment-history", snapshot, seededOrder.tableSession(), completedOrder, null, paidInvoice, payment);
    }

    private DemoEnvironmentService.DemoEnvironmentSnapshot baselineInternal() {
        clearTransientData();
        identityBootstrapService.ensureBootstrapIdentity();
        identityBootstrapService.ensureRegressionUsers();
        return demoEnvironmentService.ensureBaseline();
    }

    private void clearTransientData() {
        paymentRepository.deleteAllInBatch();
        invoiceItemRepository.deleteAllInBatch();
        serviceRequestRepository.deleteAllInBatch();
        orderHistoryRepository.deleteAllInBatch();
        reservationHistoryRepository.deleteAllInBatch();
        jdbcTemplate.update("DELETE FROM order_item_options");
        orderItemRepository.deleteAllInBatch();
        invoiceRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();
        reservationRepository.deleteAllInBatch();
        tableSessionRepository.deleteAllInBatch();

        diningTableRepository.findAll().forEach(table -> table.setStatus(TableStatus.AVAILABLE));
    }

    private SeededOrder createConfirmedStaffOrder(
            DemoEnvironmentService.DemoEnvironmentSnapshot snapshot,
            String orderNote,
            String itemNote
    ) {
        TableSession tableSession = tableSessionService.findOrOpenSessionByTableId(snapshot.table().getId());
        OrderResponse draftOrder = orderWorkflowService.create(new CreateOrderRequest(
                OrderType.DINE_IN,
                tableSession.getId(),
                null,
                orderNote
        ));
        orderWorkflowService.addItem(
                draftOrder.id(),
                new AddOrderItemRequest(snapshot.menuItem().getId(), 1, itemNote)
        );
        OrderResponse confirmedOrder = orderWorkflowService.confirm(draftOrder.id());
        return new SeededOrder(tableSession, confirmedOrder);
    }

    private DevScenarioResponse toScenarioResponse(
            String scenario,
            DemoEnvironmentService.DemoEnvironmentSnapshot snapshot,
            TableSession tableSession,
            OrderResponse order,
            ServiceRequestResponse serviceRequest
    ) {
        return toScenarioResponse(scenario, snapshot, tableSession, order, serviceRequest, null, null);
    }

    private DevScenarioResponse toScenarioResponse(
            String scenario,
            DemoEnvironmentService.DemoEnvironmentSnapshot snapshot,
            TableSession tableSession,
            OrderResponse order,
            ServiceRequestResponse serviceRequest,
            InvoiceResponse invoice,
            PaymentResponse payment
    ) {
        return new DevScenarioResponse(
                scenario,
                snapshot.table().getId(),
                snapshot.table().getCode(),
                snapshot.qr().token(),
                snapshot.qr().landingUrl(),
                tableSession == null ? null : tableSession.getId(),
                tableSession == null ? null : tableSession.getSessionCode(),
                order == null ? null : order.id(),
                order == null ? null : order.orderCode(),
                serviceRequest == null ? null : serviceRequest.id(),
                serviceRequest == null ? null : serviceRequest.requestType().name(),
                invoice == null ? null : invoice.id(),
                invoice == null ? null : invoice.invoiceNumber(),
                invoice == null ? null : invoice.status().name(),
                payment == null ? null : payment.id(),
                payment == null ? null : payment.paymentCode(),
                payment == null ? null : payment.status().name()
        );
    }

    private record SeededOrder(TableSession tableSession, OrderResponse order) {
    }
}
