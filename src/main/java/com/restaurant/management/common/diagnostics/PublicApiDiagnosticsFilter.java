package com.restaurant.management.common.diagnostics;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Profile({"local", "test"})
@ConditionalOnProperty(prefix = "app.diagnostics", name = "enabled", havingValue = "true")
public class PublicApiDiagnosticsFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(PublicApiDiagnosticsFilter.class);
    private static final String CORRELATION_HEADER = "X-Correlation-Id";
    private static final String CORRELATION_ID_KEY = "correlationId";

    private final DiagnosticsProperties diagnosticsProperties;
    private final DataSource dataSource;
    private final PublicApiDiagnosticsRecorder diagnosticsRecorder;
    private final SecureRandom secureRandom = new SecureRandom();

    public PublicApiDiagnosticsFilter(
            DiagnosticsProperties diagnosticsProperties,
            DataSource dataSource,
            PublicApiDiagnosticsRecorder diagnosticsRecorder
    ) {
        this.diagnosticsProperties = diagnosticsProperties;
        this.dataSource = dataSource;
        this.diagnosticsRecorder = diagnosticsRecorder;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/public/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.nanoTime();
        String correlationId = readCorrelationId(request);
        Throwable failure = null;

        response.setHeader(CORRELATION_HEADER, correlationId);
        MDC.put(CORRELATION_ID_KEY, correlationId);

        try {
            filterChain.doFilter(request, response);
        } catch (IOException | ServletException | RuntimeException exception) {
            failure = exception;
            throw exception;
        } finally {
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            boolean slowRequest = elapsedMs >= diagnosticsProperties.getSlowRequestThresholdMs();
            String requestPath = requestPath(request);

            if (slowRequest || failure != null) {
                log.warn(
                        "Public API request slow/failing: correlationId={}, method={}, path={}, status={}, durationMs={}, failure={}, datasource={}",
                        correlationId,
                        request.getMethod(),
                        requestPath,
                        response.getStatus(),
                        elapsedMs,
                        failure == null ? "none" : failure.getClass().getSimpleName(),
                        dataSourceSnapshot()
                );
            } else {
                log.info(
                        "Public API request completed: correlationId={}, method={}, path={}, status={}, durationMs={}",
                        correlationId,
                        request.getMethod(),
                        requestPath,
                        response.getStatus(),
                        elapsedMs
                );
            }

            diagnosticsRecorder.recordRequest(
                    requestPath,
                    request.getMethod(),
                    response.getStatus(),
                    elapsedMs,
                    slowRequest,
                    failure != null
            );
            MDC.remove(CORRELATION_ID_KEY);
        }
    }

    private String readCorrelationId(HttpServletRequest request) {
        String header = request.getHeader(CORRELATION_HEADER);
        if (header != null && !header.isBlank()) {
            return header.trim();
        }

        byte[] buffer = new byte[9];
        secureRandom.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    private String requestPath(HttpServletRequest request) {
        if (request.getQueryString() == null || request.getQueryString().isBlank()) {
            return request.getRequestURI();
        }
        return request.getRequestURI() + "?" + request.getQueryString();
    }

    private String dataSourceSnapshot() {
        if (dataSource instanceof HikariDataSource hikariDataSource) {
            HikariPoolMXBean pool = hikariDataSource.getHikariPoolMXBean();
            if (pool != null) {
                return String.format(
                        "pool=%s,active=%d,idle=%d,total=%d,awaiting=%d",
                        hikariDataSource.getPoolName(),
                        pool.getActiveConnections(),
                        pool.getIdleConnections(),
                        pool.getTotalConnections(),
                        pool.getThreadsAwaitingConnection()
                );
            }
            return "pool=" + hikariDataSource.getPoolName();
        }
        return dataSource.getClass().getSimpleName();
    }
}
