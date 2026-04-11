package com.restaurant.management.catalog.repository;

import com.restaurant.management.catalog.domain.MenuItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    Optional<MenuItem> findByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = "category")
    List<MenuItem> findAllByActiveTrueAndAvailableTrueAndCategoryActiveTrueOrderByCategorySortOrderAscNameAsc();

    @EntityGraph(attributePaths = "category")
    List<MenuItem> findAllByActiveTrueAndCategoryActiveTrueOrderByCategorySortOrderAscNameAsc();
}
