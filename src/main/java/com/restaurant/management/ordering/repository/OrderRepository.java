package com.restaurant.management.ordering.repository;

import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderTicket, Long> {

    Optional<OrderTicket> findByOrderCode(String orderCode);

    boolean existsByTableSessionIdAndStatusIn(Long tableSessionId, Collection<OrderStatus> statuses);
}
