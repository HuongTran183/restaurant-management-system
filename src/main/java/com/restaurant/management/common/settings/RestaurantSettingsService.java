package com.restaurant.management.common.settings;

import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RestaurantSettingsService {

    private static final BigDecimal DEFAULT_VAT_RATE = new BigDecimal("0.10");
    private static final BigDecimal DEFAULT_SERVICE_FEE_RATE = new BigDecimal("0.05");
    private static final String DEFAULT_RESTAURANT_NAME = "Demo Restaurant";

    private final SettingRepository settingRepository;

    public RestaurantSettingsService(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    public String getRestaurantName() {
        return settingRepository.findBySettingKey("restaurant.name")
                .map(Setting::getSettingValue)
                .filter(value -> !value.isBlank())
                .orElse(DEFAULT_RESTAURANT_NAME);
    }

    public PricingRates getPricingRates() {
        return new PricingRates(
                readDecimal("pricing.vat-rate", DEFAULT_VAT_RATE),
                readDecimal("pricing.service-fee-rate", DEFAULT_SERVICE_FEE_RATE)
        );
    }

    private BigDecimal readDecimal(String key, BigDecimal fallback) {
        return settingRepository.findBySettingKey(key)
                .map(Setting::getSettingValue)
                .map(this::parseDecimal)
                .orElse(fallback);
    }

    private BigDecimal parseDecimal(String value) {
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException exception) {
            return BigDecimal.ZERO;
        }
    }

    public record PricingRates(BigDecimal vatRate, BigDecimal serviceFeeRate) {
    }
}
