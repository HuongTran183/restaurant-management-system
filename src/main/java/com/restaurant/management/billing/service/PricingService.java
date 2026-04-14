package com.restaurant.management.billing.service;

import com.restaurant.management.common.settings.RestaurantSettingsService;
import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PricingService {

    private final RestaurantSettingsService restaurantSettingsService;

    public PricingService(RestaurantSettingsService restaurantSettingsService) {
        this.restaurantSettingsService = restaurantSettingsService;
    }

    public PricingBreakdown calculate(OrderType orderType, Collection<OrderItem> orderItems) {
        BigDecimal subtotal = orderItems.stream()
                .filter(orderItem -> orderItem.getStatus().isBillable())
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        RestaurantSettingsService.PricingRates pricingRates = restaurantSettingsService.getPricingRates();
        BigDecimal serviceFee = orderType == OrderType.DINE_IN
                ? subtotal.multiply(pricingRates.serviceFeeRate())
                : BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxableAmount = subtotal.add(serviceFee).subtract(discountAmount);
        BigDecimal vatAmount = taxableAmount.multiply(pricingRates.vatRate());
        BigDecimal totalAmount = taxableAmount.add(vatAmount);

        return new PricingBreakdown(
                money(subtotal),
                money(serviceFee),
                money(vatAmount),
                money(discountAmount),
                money(totalAmount)
        );
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public record PricingBreakdown(
            BigDecimal subtotal,
            BigDecimal serviceFee,
            BigDecimal vatAmount,
            BigDecimal discountAmount,
            BigDecimal totalAmount
    ) {
    }
}
