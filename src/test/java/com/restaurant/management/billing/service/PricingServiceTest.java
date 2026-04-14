package com.restaurant.management.billing.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.restaurant.management.common.settings.RestaurantSettingsService;
import com.restaurant.management.ordering.domain.OrderItem;
import com.restaurant.management.ordering.domain.OrderItemStatus;
import com.restaurant.management.ordering.domain.OrderType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PricingServiceTest {

    @Test
    void shouldApplyVatAndServiceFeeForDineInOrders() {
        RestaurantSettingsService restaurantSettingsService = mock(RestaurantSettingsService.class);
        when(restaurantSettingsService.getPricingRates()).thenReturn(
                new RestaurantSettingsService.PricingRates(new BigDecimal("0.10"), new BigDecimal("0.05"))
        );

        PricingService pricingService = new PricingService(restaurantSettingsService);
        OrderItem lineOne = orderItem(2, "50.00");
        OrderItem lineTwo = orderItem(1, "30.00");

        PricingService.PricingBreakdown breakdown = pricingService.calculate(OrderType.DINE_IN, List.of(lineOne, lineTwo));

        assertThat(breakdown.subtotal()).isEqualByComparingTo("130.00");
        assertThat(breakdown.serviceFee()).isEqualByComparingTo("6.50");
        assertThat(breakdown.vatAmount()).isEqualByComparingTo("13.65");
        assertThat(breakdown.totalAmount()).isEqualByComparingTo("150.15");
    }

    private OrderItem orderItem(int quantity, String unitPrice) {
        OrderItem orderItem = new OrderItem();
        orderItem.setQuantity(quantity);
        orderItem.setUnitPrice(new BigDecimal(unitPrice));
        orderItem.setLineTotal(new BigDecimal(unitPrice).multiply(BigDecimal.valueOf(quantity)));
        orderItem.setStatus(OrderItemStatus.CONFIRMED);
        return orderItem;
    }
}
