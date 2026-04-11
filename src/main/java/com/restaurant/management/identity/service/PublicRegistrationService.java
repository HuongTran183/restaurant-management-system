package com.restaurant.management.identity.service;

import com.restaurant.management.common.error.BusinessConflictException;
import com.restaurant.management.common.error.ResourceNotFoundException;
import com.restaurant.management.identity.domain.Role;
import com.restaurant.management.identity.domain.RoleCode;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.dto.AuthTokenResponse;
import com.restaurant.management.identity.dto.LoginRequest;
import com.restaurant.management.identity.dto.PublicRegistrationRequest;
import com.restaurant.management.identity.dto.StaffRegistrationRequest;
import com.restaurant.management.identity.dto.UserProfileResponse;
import com.restaurant.management.identity.repository.RoleRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PublicRegistrationService {

    private final UserAccountRepository userAccountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationService authenticationService;
    private final AuditLogService auditLogService;

    public PublicRegistrationService(
            UserAccountRepository userAccountRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationService authenticationService,
            AuditLogService auditLogService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationService = authenticationService;
        this.auditLogService = auditLogService;
    }

    /**
     * Register a customer account and return tokens for immediate login.
     */
    @Transactional
    public AuthTokenResponse registerCustomer(PublicRegistrationRequest request, String ipAddress) {
        validateUsername(request.username());
        validateEmail(request.email());

        Role customerRole = roleRepository.findByCode(RoleCode.CUSTOMER)
                .orElseThrow(() -> new ResourceNotFoundException("Customer role not configured"));

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(request.username().trim().toLowerCase());
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setFullName(request.fullName().trim());
        userAccount.setEmail(request.email().trim().toLowerCase());
        userAccount.setActive(true);
        userAccount.setRoles(Set.of(customerRole));
        userAccountRepository.save(userAccount);

        auditLogService.recordSystem("USER_REGISTER", "USER", userAccount.getId().toString(), 
                "Customer self-registration: " + userAccount.getUsername());

        // Auto-login after registration
        return authenticationService.login(
                new LoginRequest(request.username(), request.password()),
                ipAddress
        );
    }

    /**
     * Register a staff account. Account is created as inactive and requires admin approval.
     */
    @Transactional
    public UserProfileResponse registerStaff(StaffRegistrationRequest request) {
        validateUsername(request.username());
        validateEmail(request.email());
        validateStaffRole(request.role());

        Role role = roleRepository.findByCode(request.role())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.role()));

        UserAccount userAccount = new UserAccount();
        userAccount.setUsername(request.username().trim().toLowerCase());
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setFullName(request.fullName().trim());
        userAccount.setEmail(request.email().trim().toLowerCase());
        userAccount.setActive(false); // Requires admin approval
        userAccount.setRoles(Set.of(role));
        userAccountRepository.save(userAccount);

        auditLogService.recordSystem("USER_REGISTER", "USER", userAccount.getId().toString(),
                "Staff self-registration (pending approval): " + userAccount.getUsername() + " as " + request.role());

        return authenticationService.toProfile(userAccount);
    }

    private void validateUsername(String username) {
        if (userAccountRepository.existsByUsernameIgnoreCase(username.trim())) {
            throw new BusinessConflictException("Username already exists");
        }
    }

    private void validateEmail(String email) {
        if (userAccountRepository.existsByEmailIgnoreCase(email.trim())) {
            throw new BusinessConflictException("Email already registered");
        }
    }

    private void validateStaffRole(RoleCode role) {
        // Only allow specific staff roles for self-registration
        if (role == RoleCode.ADMIN || role == RoleCode.CUSTOMER) {
            throw new BusinessConflictException("Invalid role for staff registration");
        }
    }
}
