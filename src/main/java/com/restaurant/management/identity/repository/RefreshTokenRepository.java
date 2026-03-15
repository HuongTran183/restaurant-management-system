package com.restaurant.management.identity.repository;

import com.restaurant.management.identity.domain.RefreshToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByExpiresAtBefore(Instant timestamp);
}
