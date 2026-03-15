package com.restaurant.management.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
public class ProblemAccessDeniedHandler implements org.springframework.security.web.access.AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public ProblemAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            org.springframework.security.access.AccessDeniedException accessDeniedException
    ) throws IOException, ServletException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of(
                "title", "Access Denied",
                "status", HttpServletResponse.SC_FORBIDDEN,
                "detail", accessDeniedException.getMessage(),
                "path", request.getRequestURI(),
                "timestamp", Instant.now().toString()
        ));
    }
}
