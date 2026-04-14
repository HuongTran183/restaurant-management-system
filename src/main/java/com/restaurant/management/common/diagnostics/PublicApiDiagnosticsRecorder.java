package com.restaurant.management.common.diagnostics;

import io.micrometer.core.instrument.MeterRegistry;
import java.util.concurrent.TimeUnit;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "test"})
@ConditionalOnProperty(prefix = "app.diagnostics", name = "enabled", havingValue = "true")
public class PublicApiDiagnosticsRecorder {

    private static final String REQUEST_METRIC = "app.public.api.requests";
    private static final String SLOW_REQUEST_METRIC = "app.public.api.slow_requests";
    private static final String FAILURE_METRIC = "app.public.api.failures";
    private static final String PUBLIC_MENU_STEP_METRIC = "app.public.menu.steps";

    private final MeterRegistry meterRegistry;

    public PublicApiDiagnosticsRecorder(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void recordRequest(String requestPath, String method, int status, long elapsedMs, boolean slowRequest, boolean failed) {
        String endpoint = categorizePublicEndpoint(requestPath);
        String statusFamily = statusFamily(status);
        String outcome = failed ? "exception" : status >= 500 ? "server_error" : status >= 400 ? "client_error" : "success";

        meterRegistry.timer(
                        REQUEST_METRIC,
                        "endpoint", endpoint,
                        "method", method,
                        "status", statusFamily,
                        "outcome", outcome
                )
                .record(elapsedMs, TimeUnit.MILLISECONDS);

        if (slowRequest) {
            meterRegistry.counter(
                            SLOW_REQUEST_METRIC,
                            "endpoint", endpoint,
                            "method", method,
                            "status", statusFamily
                    )
                    .increment();
        }

        if (failed || status >= 500) {
            meterRegistry.counter(
                            FAILURE_METRIC,
                            "endpoint", endpoint,
                            "method", method,
                            "status", statusFamily
                    )
                    .increment();
        }
    }

    public void recordPublicMenuStep(String step, long elapsedMs) {
        meterRegistry.timer(PUBLIC_MENU_STEP_METRIC, "step", step).record(elapsedMs, TimeUnit.MILLISECONDS);
    }

    static String categorizePublicEndpoint(String requestPath) {
        if (requestPath == null || requestPath.isBlank()) {
            return "other";
        }
        if (requestPath.startsWith("/api/public/menu")) {
            return "menu";
        }
        if (requestPath.startsWith("/api/public/tables/qr")) {
            return "tables.qr";
        }
        if (requestPath.startsWith("/api/public/orders")) {
            return "orders";
        }
        if (requestPath.startsWith("/api/public/reservations")) {
            return "reservations";
        }
        return "other";
    }

    private String statusFamily(int status) {
        if (status >= 500) {
            return "5xx";
        }
        if (status >= 400) {
            return "4xx";
        }
        if (status >= 300) {
            return "3xx";
        }
        if (status >= 200) {
            return "2xx";
        }
        return "1xx";
    }
}
