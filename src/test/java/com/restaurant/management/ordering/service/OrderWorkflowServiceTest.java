package com.restaurant.management.ordering.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.restaurant.management.billing.service.PricingService;
import com.restaurant.management.common.websocket.WebSocketEventPublisher;
import com.restaurant.management.catalog.domain.MenuItem;
import com.restaurant.management.catalog.service.MenuItemService;
import com.restaurant.management.customer.repository.CustomerRepository;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableSessionStatus;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.ordering.domain.OrderHistory;
import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderItemStatus;
import com.restaurant.management.ordering.domain.OrderSourceChannel;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.domain.OrderType;
import com.restaurant.management.ordering.dto.AddOrderItemRequest;
import com.restaurant.management.ordering.dto.OrderResponse;
import com.restaurant.management.ordering.repository.OrderHistoryRepository;
import com.restaurant.management.ordering.repository.OrderItemRepository;
import com.restaurant.management.ordering.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class OrderWorkflowServiceTest {

    @Test
    void shouldAppendQrItemsToExistingConfirmedOrder() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        OrderHistoryRepository orderHistoryRepository = mock(OrderHistoryRepository.class);
        MenuItemService menuItemService = mock(MenuItemService.class);
        TableSessionService tableSessionService = mock(TableSessionService.class);
        CustomerRepository customerRepository = mock(CustomerRepository.class);
        PricingService pricingService = mock(PricingService.class);
        WebSocketEventPublisher webSocketEventPublisher = mock(WebSocketEventPublisher.class);

        OrderWorkflowService service = new OrderWorkflowService(
                orderRepository,
                orderItemRepository,
                orderHistoryRepository,
                menuItemService,
                tableSessionService,
                customerRepository,
                pricingService,
                webSocketEventPublisher
        );

        TableSession tableSession = new TableSession();
        ReflectionTestUtils.setField(tableSession, "id", 7L);
        tableSession.setSessionCode("TS-001");
        tableSession.setStatus(TableSessionStatus.OPEN);

        OrderTicket order = new OrderTicket();
        ReflectionTestUtils.setField(order, "id", 11L);
        order.setOrderCode("ORD-001");
        order.setOrderType(OrderType.DINE_IN);
        order.setSourceChannel(OrderSourceChannel.QR);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setTableSession(tableSession);

        MenuItem menuItem = new MenuItem();
        ReflectionTestUtils.setField(menuItem, "id", 5L);
        menuItem.setCode("PHO-BO");
        menuItem.setName("Pho Bo");
        menuItem.setPrice(new BigDecimal("10.00"));
        menuItem.setActive(true);
        menuItem.setAvailable(true);

        List<OrderItem> storedItems = new ArrayList<>();
        AtomicLong orderItemIds = new AtomicLong(100L);

        when(tableSessionService.findOpenSession(7L)).thenReturn(tableSession);
        when(orderRepository.findFirstByTableSessionIdAndSourceChannelAndStatusInOrderByIdAsc(
                7L,
                OrderSourceChannel.QR,
                List.of(OrderStatus.DRAFT, OrderStatus.CONFIRMED)
        )).thenReturn(Optional.of(order));
        when(menuItemService.findMenuItem(5L)).thenReturn(menuItem);
        when(orderItemRepository.save(any(OrderItem.class))).thenAnswer(invocation -> {
            OrderItem orderItem = invocation.getArgument(0);
            ReflectionTestUtils.setField(orderItem, "id", orderItemIds.incrementAndGet());
            storedItems.add(orderItem);
            return orderItem;
        });
        when(orderItemRepository.findAllByOrderIdOrderByIdAsc(11L)).thenAnswer(invocation -> List.copyOf(storedItems));
        when(pricingService.calculate(eq(OrderType.DINE_IN), any(Collection.class))).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            Collection<OrderItem> orderItems = invocation.getArgument(1);
            BigDecimal subtotal = orderItems.stream()
                    .map(OrderItem::getLineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2);
            return new PricingService.PricingBreakdown(
                    subtotal,
                    new BigDecimal("0.50"),
                    new BigDecimal("1.00"),
                    BigDecimal.ZERO.setScale(2),
                    subtotal.add(new BigDecimal("1.50")).setScale(2)
            );
        });

        OrderResponse response = service.submitQrOrder(
                7L,
                "Please make it less spicy",
                List.of(new AddOrderItemRequest(5L, 2, "No onion"))
        );

        assertThat(response.id()).isEqualTo(11L);
        assertThat(response.sourceChannel()).isEqualTo(OrderSourceChannel.QR);
        assertThat(response.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(response.note()).isEqualTo("Please make it less spicy");
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).itemName()).isEqualTo("Pho Bo");
        assertThat(response.items().get(0).status()).isEqualTo(OrderItemStatus.NEW);
        verify(orderRepository, never()).save(any(OrderTicket.class));
    }

    @Test
    void shouldConfirmAdditionalItemsForConfirmedOrder() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        OrderItemRepository orderItemRepository = mock(OrderItemRepository.class);
        OrderHistoryRepository orderHistoryRepository = mock(OrderHistoryRepository.class);
        MenuItemService menuItemService = mock(MenuItemService.class);
        TableSessionService tableSessionService = mock(TableSessionService.class);
        CustomerRepository customerRepository = mock(CustomerRepository.class);
        PricingService pricingService = mock(PricingService.class);
        WebSocketEventPublisher webSocketEventPublisher = mock(WebSocketEventPublisher.class);

        OrderWorkflowService service = new OrderWorkflowService(
                orderRepository,
                orderItemRepository,
                orderHistoryRepository,
                menuItemService,
                tableSessionService,
                customerRepository,
                pricingService,
                webSocketEventPublisher
        );

        OrderTicket order = new OrderTicket();
        ReflectionTestUtils.setField(order, "id", 22L);
        order.setOrderCode("ORD-002");
        order.setOrderType(OrderType.DINE_IN);
        order.setSourceChannel(OrderSourceChannel.QR);
        order.setStatus(OrderStatus.CONFIRMED);

        MenuItem menuItem = new MenuItem();
        ReflectionTestUtils.setField(menuItem, "id", 6L);
        menuItem.setName("Lemon Tea");

        OrderItem existingConfirmedItem = new OrderItem();
        ReflectionTestUtils.setField(existingConfirmedItem, "id", 201L);
        existingConfirmedItem.setMenuItem(menuItem);
        existingConfirmedItem.setItemNameSnapshot("Lemon Tea");
        existingConfirmedItem.setQuantity(1);
        existingConfirmedItem.setUnitPrice(new BigDecimal("3.00"));
        existingConfirmedItem.setLineTotal(new BigDecimal("3.00"));
        existingConfirmedItem.setStatus(OrderItemStatus.CONFIRMED);

        OrderItem pendingItem = new OrderItem();
        ReflectionTestUtils.setField(pendingItem, "id", 202L);
        pendingItem.setMenuItem(menuItem);
        pendingItem.setItemNameSnapshot("Lemon Tea");
        pendingItem.setQuantity(2);
        pendingItem.setUnitPrice(new BigDecimal("3.00"));
        pendingItem.setLineTotal(new BigDecimal("6.00"));
        pendingItem.setStatus(OrderItemStatus.NEW);

        when(orderRepository.findById(22L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findAllByOrderIdOrderByIdAsc(22L)).thenReturn(List.of(existingConfirmedItem, pendingItem));
        when(pricingService.calculate(eq(OrderType.DINE_IN), any(Collection.class))).thenReturn(
                new PricingService.PricingBreakdown(
                        new BigDecimal("9.00"),
                        new BigDecimal("0.45"),
                        new BigDecimal("0.95"),
                        BigDecimal.ZERO.setScale(2),
                        new BigDecimal("10.40")
                )
        );

        OrderResponse response = service.confirm(22L);

        assertThat(response.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(pendingItem.getStatus()).isEqualTo(OrderItemStatus.CONFIRMED);
        verify(orderHistoryRepository).save(argThat((OrderHistory history) ->
                history.getFromStatus() == OrderStatus.CONFIRMED
                        && history.getToStatus() == OrderStatus.CONFIRMED
                        && "Additional order items confirmed".equals(history.getNote())));
    }
}
