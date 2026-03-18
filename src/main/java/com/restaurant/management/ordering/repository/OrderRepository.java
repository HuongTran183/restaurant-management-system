package com.restaurant.management.ordering.repository;

import com.restaurant.management.ordering.domain.OrderSourceChannel;
import com.restaurant.management.ordering.domain.OrderStatus;
import com.restaurant.management.ordering.domain.OrderTicket;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface OrderRepository extends JpaRepository<OrderTicket, Long>, JpaSpecificationExecutor<OrderTicket> {

    Optional<OrderTicket> findByOrderCode(String orderCode);

    Optional<OrderTicket> findFirstByTableSessionIdAndSourceChannelAndStatusInOrderByIdAsc(
            Long tableSessionId,
            OrderSourceChannel sourceChannel,
            Collection<OrderStatus> statuses
    );

    boolean existsByTableSessionIdAndStatusIn(Long tableSessionId, Collection<OrderStatus> statuses);
}
