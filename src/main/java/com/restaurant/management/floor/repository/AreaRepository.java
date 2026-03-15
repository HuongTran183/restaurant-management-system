package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.Area;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AreaRepository extends JpaRepository<Area, Long> {

    Optional<Area> findByCodeIgnoreCase(String code);
}
