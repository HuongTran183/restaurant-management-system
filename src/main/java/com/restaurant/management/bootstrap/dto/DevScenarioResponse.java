package com.restaurant.management.bootstrap.dto;

public record DevScenarioResponse(
        String scenario,
        Long tableId,
        String tableCode,
        String qrToken,
        String qrLandingUrl,
        Long tableSessionId,
        String tableSessionCode,
        Long orderId,
        String orderCode,
        Long serviceRequestId,
        String serviceRequestType,
        Long invoiceId,
        String invoiceNumber,
        String invoiceStatus,
        Long paymentId,
        String paymentCode,
        String paymentStatus
) {
}
