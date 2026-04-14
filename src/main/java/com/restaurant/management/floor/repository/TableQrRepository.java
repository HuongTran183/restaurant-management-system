package com.restaurant.management.floor.repository;

import com.restaurant.management.floor.domain.TableQr;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableQrRepository extends JpaRepository<TableQr, Long> {

    Optional<TableQr> findByDiningTableId(Long diningTableId);

    Optional<TableQr> findByToken(String token);
}
