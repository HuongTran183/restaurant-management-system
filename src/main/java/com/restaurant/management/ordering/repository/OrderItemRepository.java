package com.restaurant.management.ordering.repository;

import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderItemStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrderIdOrderByIdAsc(Long orderId);

    List<OrderItem> findAllByStatusInOrderByIdAsc(List<OrderItemStatus> statuses);
}
