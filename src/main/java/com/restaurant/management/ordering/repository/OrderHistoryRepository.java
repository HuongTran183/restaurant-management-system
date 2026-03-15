package com.restaurant.management.ordering.repository;

import com.restaurant.management.ordering.domain.OrderHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderHistoryRepository extends JpaRepository<OrderHistory, Long> {
}
