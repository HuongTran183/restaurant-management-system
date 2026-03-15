package com.restaurant.management.floor.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.DiningTable;
import com.restaurant.management.floor.dto.DiningTableRequest;
import com.restaurant.management.floor.dto.DiningTableResponse;
import com.restaurant.management.floor.repository.DiningTableRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DiningTableService {

    private final DiningTableRepository diningTableRepository;
    private final AreaService areaService;

    public DiningTableService(DiningTableRepository diningTableRepository, AreaService areaService) {
        this.diningTableRepository = diningTableRepository;
        this.areaService = areaService;
    }

    @Transactional(readOnly = true)
    public PageResponse<DiningTableResponse> list(PageRequest pageRequest) {
        return PageResponse.from(diningTableRepository.findAll(pageRequest).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public DiningTableResponse get(Long tableId) {
        return toResponse(findTable(tableId));
    }

    @Transactional
    public DiningTableResponse create(DiningTableRequest request) {
        diningTableRepository.findByCodeIgnoreCase(request.code()).ifPresent(existing -> {
            throw new BusinessConflictException("Table code already exists: " + request.code());
        });
        DiningTable diningTable = new DiningTable();
        applyRequest(diningTable, request);
        return toResponse(diningTableRepository.save(diningTable));
    }

    @Transactional
    public DiningTableResponse update(Long tableId, DiningTableRequest request) {
        DiningTable diningTable = findTable(tableId);
        diningTableRepository.findByCodeIgnoreCase(request.code())
                .filter(existing -> !existing.getId().equals(tableId))
                .ifPresent(existing -> {
                    throw new BusinessConflictException("Table code already exists: " + request.code());
                });
        applyRequest(diningTable, request);
        return toResponse(diningTable);
    }

    public DiningTable findTable(Long tableId) {
        return diningTableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + tableId));
    }

    private void applyRequest(DiningTable diningTable, DiningTableRequest request) {
        diningTable.setCode(request.code());
        diningTable.setName(request.name());
        diningTable.setSeatCount(request.seatCount());
        diningTable.setStatus(request.status());
        diningTable.setActive(request.active());
        diningTable.setArea(areaService.findArea(request.areaId()));
    }

    private DiningTableResponse toResponse(DiningTable diningTable) {
        return new DiningTableResponse(
                diningTable.getId(),
                diningTable.getCode(),
                diningTable.getName(),
                diningTable.getSeatCount(),
                diningTable.getStatus(),
                diningTable.isActive(),
                diningTable.getArea().getId(),
                diningTable.getArea().getName()
        );
    }
}
