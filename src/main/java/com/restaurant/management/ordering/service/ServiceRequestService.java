package com.restaurant.management.ordering.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.domain.ServiceRequest;
import com.restaurant.management.ordering.domain.ServiceRequestStatus;
import com.restaurant.management.ordering.domain.ServiceRequestType;
import com.restaurant.management.ordering.dto.CreateServiceRequestRequest;
import com.restaurant.management.ordering.dto.ServiceRequestResponse;
import com.restaurant.management.ordering.repository.ServiceRequestRepository;
import java.time.Instant;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final TableSessionService tableSessionService;
    private final OrderWorkflowService orderWorkflowService;

    public ServiceRequestService(
            ServiceRequestRepository serviceRequestRepository,
            TableSessionService tableSessionService,
            OrderWorkflowService orderWorkflowService
    ) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.tableSessionService = tableSessionService;
        this.orderWorkflowService = orderWorkflowService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ServiceRequestResponse> list(
            PageRequest pageRequest,
            ServiceRequestStatus status,
            ServiceRequestType requestType,
            String query
    ) {
        Specification<ServiceRequest> specification = (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (status != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }
        if (requestType != null) {
            specification = specification.and((root, criteriaQuery, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("requestType"), requestType));
        }
        if (hasText(query)) {
            String normalized = like(query);
            specification = specification.and((root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("note")), normalized),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("requestType").as(String.class)), normalized)
            ));
        }
        return PageResponse.from(serviceRequestRepository.findAll(specification, pageRequest).map(this::toResponse));
    }

    @Transactional
    public ServiceRequestResponse create(CreateServiceRequestRequest request) {
        return createForSession(request.tableSessionId(), request.orderId(), request.requestType(), request.note());
    }

    @Transactional
    public ServiceRequestResponse createForSession(
            Long tableSessionId,
            Long orderId,
            ServiceRequestType requestType,
            String note
    ) {
        if (tableSessionId == null && orderId == null) {
            throw new BusinessConflictException("A service request must be linked to a table session or an order");
        }

        TableSession tableSession = tableSessionId == null
                ? null
                : tableSessionService.findOpenSession(tableSessionId);
        OrderTicket order = orderId == null
                ? null
                : orderWorkflowService.findOrder(orderId);

        if (tableSession == null && order != null && order.getTableSession() != null) {
            tableSession = order.getTableSession();
        }
        if (tableSession != null && order != null && order.getTableSession() != null
                && !order.getTableSession().getId().equals(tableSession.getId())) {
            throw new BusinessConflictException("Order does not belong to the provided table session");
        }

        if (requestType == ServiceRequestType.REQUEST_BILL && order != null) {
            order.setPaymentRequested(true);
        }

        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setTableSession(tableSession);
        serviceRequest.setOrder(order);
        serviceRequest.setRequestType(requestType);
        serviceRequest.setNote(note);
        serviceRequest.setStatus(ServiceRequestStatus.OPEN);
        serviceRequest.setRequestedAt(Instant.now());
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestResponse resolve(Long requestId) {
        ServiceRequest serviceRequest = findRequest(requestId);
        if (serviceRequest.getStatus() != ServiceRequestStatus.OPEN) {
            throw new BusinessConflictException("Service request is already closed: " + requestId);
        }

        serviceRequest.setStatus(ServiceRequestStatus.RESOLVED);
        serviceRequest.setResolvedAt(Instant.now());
        if (serviceRequest.getRequestType() == ServiceRequestType.REQUEST_BILL && serviceRequest.getOrder() != null) {
            serviceRequest.getOrder().setPaymentRequested(false);
        }
        return toResponse(serviceRequest);
    }

    private ServiceRequest findRequest(Long requestId) {
        return serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found: " + requestId));
    }

    private ServiceRequestResponse toResponse(ServiceRequest serviceRequest) {
        return new ServiceRequestResponse(
                serviceRequest.getId(),
                serviceRequest.getTableSession() == null ? null : serviceRequest.getTableSession().getId(),
                serviceRequest.getOrder() == null ? null : serviceRequest.getOrder().getId(),
                serviceRequest.getRequestType(),
                serviceRequest.getNote(),
                serviceRequest.getStatus(),
                serviceRequest.getRequestedAt(),
                serviceRequest.getResolvedAt()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
