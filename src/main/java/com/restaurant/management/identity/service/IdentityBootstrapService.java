package com.restaurant.management.identity.service;

import com.restaurant.management.common.security.SeedAdminProperties;
import com.restaurant.management.identity.domain.Role;
import com.restaurant.management.identity.domain.RoleCode;
import com.restaurant.management.identity.domain.UserAccount;
import com.restaurant.management.identity.repository.RoleRepository;
import com.restaurant.management.identity.repository.UserAccountRepository;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class IdentityBootstrapService implements ApplicationRunner {

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
        ensureRoles();
        ensureAdmin();
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
        if (userAccountRepository.existsByUsernameIgnoreCase(seedAdminProperties.getUsername())) {
            return;
        }
        UserAccount admin = new UserAccount();
        admin.setUsername(seedAdminProperties.getUsername());
        admin.setPasswordHash(passwordEncoder.encode(seedAdminProperties.getPassword()));
        admin.setFullName(seedAdminProperties.getFullName());
        admin.setEmail(seedAdminProperties.getEmail());
        admin.setActive(true);
        admin.setRoles(new LinkedHashSet<>(roleRepository.findAllByCodeIn(Set.of(RoleCode.ADMIN, RoleCode.MANAGER))));
        UserAccount saved = userAccountRepository.save(admin);
        auditLogService.recordSystem("BOOTSTRAP_ADMIN_CREATED", "USER", saved.getId().toString(), saved.getUsername());
    }
}
