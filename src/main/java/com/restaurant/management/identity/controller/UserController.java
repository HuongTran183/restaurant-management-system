package com.restaurant.management.identity.controller;

import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.identity.dto.CreateUserRequest;
import com.restaurant.management.identity.dto.UpdateUserRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class UserController {

    private final UserManagementService userManagementService;

    public UserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public PageResponse<UserProfileResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort
    ) {
        return userManagementService.list(PageRequest.of(page, size, Sort.by(sort).descending()));
    }

    @GetMapping("/{userId}")
    public UserProfileResponse get(@PathVariable Long userId) {
        return userManagementService.get(userId);
    }

    @PostMapping
    public UserProfileResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userManagementService.create(request);
    }

    @PutMapping("/{userId}")
    public UserProfileResponse update(@PathVariable Long userId, @Valid @RequestBody UpdateUserRequest request) {
        return userManagementService.update(userId, request);
    }
}
