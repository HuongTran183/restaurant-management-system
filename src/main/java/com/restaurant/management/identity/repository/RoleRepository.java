package com.restaurant.management.identity.repository;

import com.restaurant.management.identity.domain.Role;
import com.restaurant.management.identity.domain.RoleCode;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(RoleCode code);

    List<Role> findAllByCodeIn(Collection<RoleCode> codes);
}
