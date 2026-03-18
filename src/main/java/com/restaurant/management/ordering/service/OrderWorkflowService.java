package com.restaurant.management.ordering.service;

import com.restaurant.management.billing.service.PricingService;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.service.MenuItemService;
import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.customer.domain.Customer;
import com.restaurant.management.customer.repository.CustomerRepository;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.ordering.domain.OrderHistory;
import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderItemStatus;
import com.restaurant.management.ordering.domain.OrderSourceChannel;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.domain.OrderType;
import com.restaurant.management.ordering.dto.AddOrderItemRequest;
import com.restaurant.management.ordering.dto.CreateOrderRequest;
import com.restaurant.management.ordering.dto.OrderItemResponse;
import com.restaurant.management.ordering.dto.OrderResponse;
import com.restaurant.management.ordering.dto.UpdateOrderItemRequest;
import com.restaurant.management.ordering.repository.OrderHistoryRepository;
import com.restaurant.management.ordering.repository.OrderItemRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderWorkflowService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final MenuItemService menuItemService;
    private final TableSessionService tableSessionService;
    private final CustomerRepository customerRepository;
    private final PricingService pricingService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OrderWorkflowService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OrderHistoryRepository orderHistoryRepository,
            MenuItemService menuItemService,
            TableSessionService tableSessionService,
            CustomerRepository customerRepository,
            PricingService pricingService
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.menuItemService = menuItemService;
        this.tableSessionService = tableSessionService;
        this.customerRepository = customerRepository;
        this.pricingService = pricingService;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> list(
            PageRequest pageRequest,
            OrderStatus status,
            OrderSourceChannel sourceChannel,
            Long tableSessionId,
            String query
    ) {
        Specification<OrderTicket> specification = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (status != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }
        if (sourceChannel != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("sourceChannel"), sourceChannel));
        }
        if (tableSessionId != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("tableSession").get("id"), tableSessionId));
        }
        if (hasText(query)) {
            String normalized = like(query);
            specification = specification.and((root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("orderCode")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("note")), normalized)
            ));
        }

        Page<OrderTicket> page = orderRepository.findAll(specification, pageRequest);
        return PageResponse.from(page.map(order -> toResponse(order, findOrderItems(order.getId()))));
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long orderId) {
        OrderTicket order = findOrder(orderId);
        return toResponse(order, findOrderItems(orderId));
    }

    @Transactional(readOnly = true)
    public OrderResponse getByOrderCode(String orderCode) {
        OrderTicket order = findOrderByCode(orderCode);
        return toResponse(order, findOrderItems(order.getId()));
    }

    @Transactional(readOnly = true)
    public OrderResponse getPublicByOrderCode(String orderCode) {
        OrderTicket order = findOrderByCode(orderCode);
        if (order.getSourceChannel() != OrderSourceChannel.QR) {
            throw new ResourceNotFoundException("Order not found: " + orderCode);
        }
        return toResponse(order, findOrderItems(order.getId()));
    }
    @Transactional(readOnly = true)
    public Optional<OrderTicket> findActiveQrOrderForSession(Long tableSessionId) {
        return orderRepository.findFirstByTableSessionIdAndSourceChannelAndStatusInOrderByIdAsc(
                tableSessionId,
                OrderSourceChannel.QR,
                List.of(OrderStatus.DRAFT, OrderStatus.CONFIRMED)
        );
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        OrderTicket order = createEmptyOrder(
                request.orderType(),
                OrderSourceChannel.STAFF,
                request.tableSessionId(),
                request.customerId(),
                request.note()
        );
        return toResponse(order, List.of());
    }

    @Transactional
    public OrderResponse submitQrOrder(Long tableSessionId, String note, List<AddOrderItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessConflictException("QR order must contain at least one item");
        }

        TableSession tableSession = tableSessionService.findOpenSession(tableSessionId);
        OrderTicket order = findActiveQrOrderForSession(tableSessionId)
                .orElseGet(() -> createEmptyOrder(OrderType.DINE_IN, OrderSourceChannel.QR, tableSession.getId(), null, note));

        assertCanAddItems(order);
        if (hasText(note)) {
            order.setNote(note);
        }

        for (AddOrderItemRequest request : items) {
            appendItem(order, request);
        }

        List<OrderItem> orderItems = findOrderItems(order.getId());
        reprice(order, orderItems);
        return toResponse(order, orderItems);
    }

    @Transactional
    public OrderResponse addItem(Long orderId, AddOrderItemRequest request) {
        OrderTicket order = findOrder(orderId);
        assertCanAddItems(order);
        appendItem(order, request);

        List<OrderItem> items = findOrderItems(orderId);
        reprice(order, items);
        return toResponse(order, items);
    }

    @Transactional
    public OrderResponse updateItem(Long orderId, Long orderItemId, UpdateOrderItemRequest request) {
        OrderTicket order = findOrder(orderId);
        assertDraftEditable(order);

        OrderItem orderItem = findOrderItem(orderId, orderItemId);
        if (request.cancelled()) {
            orderItem.setStatus(OrderItemStatus.CANCELLED);
        } else {
            if (orderItem.getStatus() == OrderItemStatus.CANCELLED) {
                throw new BusinessConflictException("Cancelled order items cannot be edited");
            }
            if (request.quantity() != null) {
                orderItem.setQuantity(request.quantity());
                orderItem.setLineTotal(money(orderItem.getUnitPrice().multiply(BigDecimal.valueOf(request.quantity()))));
            }
            orderItem.setNote(request.note());
        }

        List<OrderItem> items = findOrderItems(orderId);
        reprice(order, items);
        return toResponse(order, items);
    }

    @Transactional
    public OrderResponse confirm(Long orderId) {
        OrderTicket order = findOrder(orderId);
        if (order.getStatus() != OrderStatus.DRAFT && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessConflictException("Order cannot be confirmed from status: " + order.getStatus());
        }

        List<OrderItem> items = findOrderItems(orderId);
        boolean hasBillableItems = items.stream().anyMatch(item -> item.getStatus().isBillable());
        if (!hasBillableItems) {
            throw new BusinessConflictException("Order must contain at least one active item before confirmation");
        }

        List<OrderItem> pendingItems = items.stream()
                .filter(item -> item.getStatus() == OrderItemStatus.NEW)
                .toList();
        if (pendingItems.isEmpty() && order.getStatus() == OrderStatus.CONFIRMED) {
            throw new BusinessConflictException("Order does not have any new items pending confirmation");
        }

        pendingItems.forEach(item -> item.setStatus(OrderItemStatus.CONFIRMED));
        if (order.getStatus() == OrderStatus.DRAFT) {
            changeStatus(order, OrderStatus.CONFIRMED, "Order confirmed");
        } else {
            recordHistory(order, OrderStatus.CONFIRMED, OrderStatus.CONFIRMED, "Additional order items confirmed");
        }
        reprice(order, items);
        return toResponse(order, items);
    }

    @Transactional
    public OrderResponse cancel(Long orderId) {
        OrderTicket order = findOrder(orderId);
        if (!order.getStatus().canCancel()) {
            throw new BusinessConflictException("Order cannot be cancelled from status: " + order.getStatus());
        }

        List<OrderItem> items = findOrderItems(orderId);
        items.forEach(item -> item.setStatus(OrderItemStatus.CANCELLED));
        changeStatus(order, OrderStatus.CANCELLED, "Order cancelled");
        reprice(order, items);
        return toResponse(order, items);
    }

    @Transactional
    public void completeAfterPayment(Long orderId) {
        OrderTicket order = findOrder(orderId);
        order.setPaymentRequested(false);
        if (order.getStatus().canComplete()) {
            changeStatus(order, OrderStatus.COMPLETED, "Invoice paid");
        }
    }

    public OrderTicket findOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
    }

    public OrderTicket findOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderCode));
    }

    private OrderTicket createEmptyOrder(
            OrderType orderType,
            OrderSourceChannel sourceChannel,
            Long tableSessionId,
            Long customerId,
            String note
    ) {
        OrderTicket order = new OrderTicket();
        order.setOrderCode(nextCode("ORD"));
        order.setOrderType(orderType);
        order.setSourceChannel(sourceChannel);
        order.setNote(note);
        order.setStatus(OrderStatus.DRAFT);
        order.setPaymentRequested(false);

        if (orderType == OrderType.DINE_IN) {
            if (tableSessionId == null) {
                throw new BusinessConflictException("Dine-in orders require an open table session");
            }
            order.setTableSession(tableSessionService.findOpenSession(tableSessionId));
        }

        if (customerId != null) {
            order.setCustomer(findCustomer(customerId));
        }

        reprice(order, List.of());
        OrderTicket saved = orderRepository.save(order);
        recordHistory(saved, null, OrderStatus.DRAFT, sourceChannel == OrderSourceChannel.QR ? "QR order created" : "Order created");
        return saved;
    }

    private void appendItem(OrderTicket order, AddOrderItemRequest request) {
        MenuItem menuItem = menuItemService.findMenuItem(request.menuItemId());
        if (!menuItem.isActive() || !menuItem.isAvailable()) {
            throw new BusinessConflictException("Menu item is not available for ordering: " + menuItem.getCode());
        }

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setMenuItem(menuItem);
        orderItem.setItemNameSnapshot(menuItem.getName());
        orderItem.setQuantity(request.quantity());
        orderItem.setUnitPrice(money(menuItem.getPrice()));
        orderItem.setLineTotal(money(menuItem.getPrice().multiply(BigDecimal.valueOf(request.quantity()))));
        orderItem.setNote(request.note());
        orderItem.setStatus(OrderItemStatus.NEW);
        orderItemRepository.save(orderItem);
    }

    private void assertCanAddItems(OrderTicket order) {
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.COMPLETED) {
            throw new BusinessConflictException("Order items cannot be added after the order is completed or cancelled");
        }
    }

    private void assertDraftEditable(OrderTicket order) {
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new BusinessConflictException("Order items can only be edited while the order is in DRAFT state");
        }
    }

    private List<OrderItem> findOrderItems(Long orderId) {
        return orderItemRepository.findAllByOrderIdOrderByIdAsc(orderId);
    }

    private OrderItem findOrderItem(Long orderId, Long orderItemId) {
        return findOrderItems(orderId).stream()
                .filter(orderItem -> orderItem.getId().equals(orderItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + orderItemId));
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId)
                .filter(Customer::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + customerId));
    }

    private void reprice(OrderTicket order, List<OrderItem> orderItems) {
        PricingService.PricingBreakdown pricingBreakdown = pricingService.calculate(order.getOrderType(), orderItems);
        order.setSubtotal(pricingBreakdown.subtotal());
        order.setServiceFee(pricingBreakdown.serviceFee());
        order.setVatAmount(pricingBreakdown.vatAmount());
        order.setDiscountAmount(pricingBreakdown.discountAmount());
        order.setTotalAmount(pricingBreakdown.totalAmount());
    }

    private void changeStatus(OrderTicket order, OrderStatus targetStatus, String note) {
        OrderStatus previousStatus = order.getStatus();
        order.setStatus(targetStatus);
        recordHistory(order, previousStatus, targetStatus, note);
    }

    private void recordHistory(OrderTicket order, OrderStatus fromStatus, OrderStatus toStatus, String note) {
        OrderHistory history = new OrderHistory();
        history.setOrder(order);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedAt(Instant.now());
        history.setNote(note);
        orderHistoryRepository.save(history);
    }

    private OrderResponse toResponse(OrderTicket order, List<OrderItem> orderItems) {
        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getTableSession() == null ? null : order.getTableSession().getId(),
                order.getCustomer() == null ? null : order.getCustomer().getId(),
                order.getOrderType(),
                order.getSourceChannel(),
                order.getStatus(),
                order.getSubtotal(),
                order.getServiceFee(),
                order.getVatAmount(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.isPaymentRequested(),
                order.getNote(),
                orderItems.stream().map(this::toOrderItemResponse).toList()
        );
    }

    private OrderItemResponse toOrderItemResponse(OrderItem orderItem) {
        return new OrderItemResponse(
                orderItem.getId(),
                orderItem.getMenuItem().getId(),
                orderItem.getItemNameSnapshot(),
                orderItem.getQuantity(),
                orderItem.getUnitPrice(),
                orderItem.getLineTotal(),
                orderItem.getNote(),
                orderItem.getStatus()
        );
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }

    private String nextCode(String prefix) {
        byte[] buffer = new byte[6];
        secureRandom.nextBytes(buffer);
        return prefix + "-" + Base64.getUrlEncoder().withoutPadding().encodeToString(buffer).toUpperCase();
    }
}


