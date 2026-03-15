package com.restaurant.management.identity.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.common.web.PageResponse;
import com.restaurant.management.identity.domain.Role;
import com.restaurant.management.identity.domain.RoleCode;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.dto.CreateUserRequest;
import com.restaurant.management.identity.dto.UpdateUserRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.repository.RoleRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationService authenticationService;

    public UserManagementService(
            UserAccountRepository userAccountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationService authenticationService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationService = authenticationService;
    }

    public PageResponse<UserProfileResponse> list(PageRequest pageRequest) {
        return PageResponse.from(userAccountRepository.findAll(pageRequest).map(authenticationService::toProfile));
    }

    public UserProfileResponse get(Long userId) {
        return authenticationService.toProfile(findUser(userId));
    }

    @Transactional
    public UserProfileResponse create(CreateUserRequest request) {
        if (userAccountRepository.existsByUsernameIgnoreCase(request.username())) {
            throw new BusinessConflictException("Username already exists: " + request.username());
        }
        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(request.username());
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setFullName(request.fullName());
        userAccount.setEmail(request.email());
        userAccount.setActive(true);
        userAccount.setRoles(loadRoles(request.roles()));
        return authenticationService.toProfile(userAccountRepository.save(userAccount));
    }

    @Transactional
    public UserProfileResponse update(Long userId, UpdateUserRequest request) {
        UserAccount userAccount = findUser(userId);
        userAccount.setFullName(request.fullName());
        userAccount.setEmail(request.email());
        userAccount.setActive(request.active());
        userAccount.setRoles(loadRoles(request.roles()));
        return authenticationService.toProfile(userAccount);
    }

    private UserAccount findUser(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private Set<Role> loadRoles(Set<RoleCode> codes) {
        List<Role> roles = roleRepository.findAllByCodeIn(codes);
        if (roles.size() != codes.size()) {
            throw new ResourceNotFoundException("One or more roles do not exist");
        }
        return new LinkedHashSet<>(roles);
    }
}
