package com.restaurant.management.ordering.repository;

import com.restaurant.management.ordering.domain.ServiceRequest;
import com.restaurant.management.ordering.domain.ServiceRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    Page<ServiceRequest> findAllByStatusOrderByRequestedAtAsc(ServiceRequestStatus status, Pageable pageable);
}
