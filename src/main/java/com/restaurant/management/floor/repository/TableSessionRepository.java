package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.TableSession;
import com.restaurant.management.floor.domain.TableSessionStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TableSessionRepository extends JpaRepository<TableSession, Long>, JpaSpecificationExecutor<TableSession> {

    @EntityGraph(attributePaths = "diningTable")
    Page<TableSession> findAll(Specification<TableSession> specification, Pageable pageable);

    Optional<TableSession> findFirstByDiningTableIdAndStatusOrderByOpenedAtDesc(Long diningTableId, TableSessionStatus status);
}
