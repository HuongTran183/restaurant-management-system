package com.restaurant.management.floor.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.floor.domain.Area;
import com.restaurant.management.floor.dto.AreaRequest;
import com.restaurant.management.floor.dto.AreaResponse;
import com.restaurant.management.floor.repository.AreaRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AreaService {

    private final AreaRepository areaRepository;

    public AreaService(AreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    public PageResponse<AreaResponse> list(PageRequest pageRequest) {
        return PageResponse.from(areaRepository.findAll(pageRequest).map(this::toResponse));
    }

    public AreaResponse get(Long areaId) {
        return toResponse(findArea(areaId));
    }

    @Transactional
    public AreaResponse create(AreaRequest request) {
        areaRepository.findByCodeIgnoreCase(request.code()).ifPresent(area -> {
            throw new BusinessConflictException("Area code already exists: " + request.code());
        });
        Area area = new Area();
        area.setCode(request.code());
        area.setName(request.name());
        area.setDescription(request.description());
        area.setActive(request.active());
        return toResponse(areaRepository.save(area));
    }

    @Transactional
    public AreaResponse update(Long areaId, AreaRequest request) {
        Area area = findArea(areaId);
        areaRepository.findByCodeIgnoreCase(request.code())
                .filter(existing -> !existing.getId().equals(areaId))
                .ifPresent(existing -> {
                    throw new BusinessConflictException("Area code already exists: " + request.code());
                });
        area.setCode(request.code());
        area.setName(request.name());
        area.setDescription(request.description());
        area.setActive(request.active());
        return toResponse(area);
    }

    public Area findArea(Long areaId) {
        return areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + areaId));
    }

    private AreaResponse toResponse(Area area) {
        return new AreaResponse(area.getId(), area.getCode(), area.getName(), area.getDescription(), area.isActive());
    }
}
