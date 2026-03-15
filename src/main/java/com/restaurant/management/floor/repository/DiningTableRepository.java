package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.DiningTable;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long> {

    Optional<DiningTable> findByCodeIgnoreCase(String code);
}
