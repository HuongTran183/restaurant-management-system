package com.restaurant.management.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

    private final AppJwtProperties properties;
    private final SecretKey secretKey;

    public JwtTokenService(AppJwtProperties properties) {
        this.properties = properties;
        this.secretKey = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public IssuedAccessToken issueAccessToken(AuthenticatedUser user) {
        Instant expiresAt = Instant.now().plus(properties.getAccessTokenMinutes(), ChronoUnit.MINUTES);
        String token = Jwts.builder()
                .subject(user.getUsername())
                .issuer(properties.getIssuer())
                .claim("userId", user.getId())
                .claim("fullName", user.getFullName())
                .claim("roles", user.getAuthorities().stream().map(Object::toString).toList())
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey)
                .compact();
        return new IssuedAccessToken(token, expiresAt);
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String username) {
        Claims claims = parseClaims(token);
        return username.equalsIgnoreCase(claims.getSubject()) && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public record IssuedAccessToken(String token, Instant expiresAt) {
    }
}
