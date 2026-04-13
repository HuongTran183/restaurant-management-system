package com.restaurant.management.identity.service;

import com.restaurant.management.common.security.SeedAdminProperties;
import com.restaurant.management.identity.domain.Role;
import com.restaurant.management.identity.domain.RoleCode;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.repository.RoleRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class IdentityBootstrapService implements ApplicationRunner {

    private static final List<SeedUser> REGRESSION_USERS = List.of(
            new SeedUser("admin01", "Admin@123", "Regression Admin", "admin01@restaurant.local", Set.of(RoleCode.ADMIN)),
            new SeedUser("manager01", "Manager@123", "Regression Manager", "manager01@restaurant.local", Set.of(RoleCode.MANAGER)),
            new SeedUser("waiter01", "Waiter@123", "Regression Waiter", "waiter01@restaurant.local", Set.of(RoleCode.WAITER)),
            new SeedUser("cashier01", "Cashier@123", "Regression Cashier", "cashier01@restaurant.local", Set.of(RoleCode.CASHIER))
    );

    private final RoleRepository roleRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final SeedAdminProperties seedAdminProperties;
    private final AuditLogService auditLogService;

    public IdentityBootstrapService(
            RoleRepository roleRepository,
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            SeedAdminProperties seedAdminProperties,
            AuditLogService auditLogService
    ) {
        this.roleRepository = roleRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedAdminProperties = seedAdminProperties;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureBootstrapIdentity();
    }

    @Transactional
    public void ensureBootstrapIdentity() {
        ensureRoles();
        ensureAdmin();
    }

    @Transactional
    public void ensureRegressionUsers() {
        ensureRoles();
        REGRESSION_USERS.forEach(this::ensureUser);
    }

    private void ensureRoles() {
        for (RoleCode code : RoleCode.values()) {
            roleRepository.findByCode(code).orElseGet(() -> {
                Role role = new Role();
                role.setCode(code);
                role.setName(code.name());
                role.setDescription("System role " + code.name());
                return roleRepository.save(role);
            });
        }
    }

    private void ensureAdmin() {
        ensureUser(new SeedUser(
                seedAdminProperties.getUsername(),
                seedAdminProperties.getPassword(),
                seedAdminProperties.getFullName(),
                seedAdminProperties.getEmail(),
                Set.of(RoleCode.ADMIN, RoleCode.MANAGER)
        ));
    }

    private void ensureUser(SeedUser seedUser) {
        if (userAccountRepository.existsByUsernameIgnoreCase(seedUser.username())) {
            return;
        }

        UserAccount user = new UserAccount();
        user.setUsername(seedUser.username());
        user.setPasswordHash(passwordEncoder.encode(seedUser.password()));
        user.setFullName(seedUser.fullName());
        user.setEmail(seedUser.email());
        user.setActive(true);
        user.setRoles(new LinkedHashSet<>(roleRepository.findAllByCodeIn(seedUser.roles())));

        UserAccount saved = userAccountRepository.save(user);
        auditLogService.recordSystem(
                "BOOTSTRAP_USER_CREATED",
                "USER",
                saved.getId().toString(),
                saved.getUsername()
        );
    }

    private record SeedUser(String username, String password, String fullName, String email, Set<RoleCode> roles) {
    }
}
