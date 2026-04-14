package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.DiningTable;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DiningTableRepository extends JpaRepository<DiningTable, Long>, JpaSpecificationExecutor<DiningTable> {

    @EntityGraph(attributePaths = "area")
    Page<DiningTable> findAll(Specification<DiningTable> specification, Pageable pageable);

    @EntityGraph(attributePaths = "area")
    List<DiningTable> findAllByActiveTrueOrderByArea_NameAscNameAsc();

    Optional<DiningTable> findByCodeIgnoreCase(String code);
}
