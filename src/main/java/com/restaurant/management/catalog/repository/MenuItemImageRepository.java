package com.restaurant.management.catalog.repository;

import com.restaurant.management.catalog.domain.MenuItemImage;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemImageRepository extends JpaRepository<MenuItemImage, Long> {

    List<MenuItemImage> findAllByMenuItemIdInOrderByIdAsc(Collection<Long> menuItemIds);
}
