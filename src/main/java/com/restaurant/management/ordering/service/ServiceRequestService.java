package com.restaurant.management.ordering.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.service.TableSessionService;
import com.restaurant.management.ordering.domain.OrderTicket;
import com.restaurant.management.ordering.domain.ServiceRequest;
import com.restaurant.management.ordering.domain.ServiceRequestStatus;
import com.restaurant.management.ordering.dto.CreateServiceRequestRequest;
import com.restaurant.management.ordering.dto.ServiceRequestResponse;
import com.restaurant.management.ordering.repository.ServiceRequestRepository;
import java.time.Instant;
import org.springframework.data.domain.PageRequest;
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
    public PageResponse<ServiceRequestResponse> listOpen(PageRequest pageRequest) {
        return PageResponse.from(serviceRequestRepository
                .findAllByStatusOrderByRequestedAtAsc(ServiceRequestStatus.OPEN, pageRequest)
                .map(this::toResponse));
    }

    @Transactional
    public ServiceRequestResponse create(CreateServiceRequestRequest request) {
        if (request.tableSessionId() == null && request.orderId() == null) {
            throw new BusinessConflictException("A service request must be linked to a table session or an order");
        }

        TableSession tableSession = request.tableSessionId() == null
                ? null
                : tableSessionService.findOpenSession(request.tableSessionId());
        OrderTicket order = request.orderId() == null
                ? null
                : orderWorkflowService.findOrder(request.orderId());

        if (tableSession == null && order != null && order.getTableSession() != null) {
            tableSession = order.getTableSession();
        }

        if (request.requestType().name().equals("REQUEST_BILL") && order != null) {
            order.setPaymentRequested(true);
        }

        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setTableSession(tableSession);
        serviceRequest.setOrder(order);
        serviceRequest.setRequestType(request.requestType());
        serviceRequest.setNote(request.note());
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
        if (serviceRequest.getRequestType().name().equals("REQUEST_BILL") && serviceRequest.getOrder() != null) {
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
}
