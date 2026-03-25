package com.restaurant.management.bootstrap.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.restaurant.management.bootstrap.service.DevSupportService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

class DevSupportControllerProfileTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(DevSupportControllerTestConfiguration.class);

    @Test
    void shouldNotLoadControllerOutsideLocalAndTestProfiles() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=prod",
                        "app.dev-support.enabled=true"
                )
                .run(context -> assertThat(context.getBeansOfType(DevSupportController.class)).isEmpty());
    }

    @Test
    void shouldLoadControllerInTestProfileWhenEnabled() {
        contextRunner
                .withPropertyValues(
                        "spring.profiles.active=test",
                        "app.dev-support.enabled=true"
                )
                .run(context -> assertThat(context.getBeansOfType(DevSupportController.class)).hasSize(1));
    }

    @Configuration(proxyBeanMethods = false)
    @Import(DevSupportController.class)
    static class DevSupportControllerTestConfiguration {

        @Bean
        DevSupportService devSupportService() {
            return org.mockito.Mockito.mock(DevSupportService.class);
        }
    }
}
