package com.restaurant.management.bootstrap.service;

import com.restaurant.management.floor.dto.TableQrResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@ConditionalOnProperty(prefix = "app.bootstrap.demo", name = "enabled", havingValue = "true")
public class DemoBootstrapService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoBootstrapService.class);

    private final DemoEnvironmentService demoEnvironmentService;

    public DemoBootstrapService(DemoEnvironmentService demoEnvironmentService) {
        this.demoEnvironmentService = demoEnvironmentService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        DemoEnvironmentService.DemoEnvironmentSnapshot snapshot = demoEnvironmentService.ensureBaseline();
        TableQrResponse qr = snapshot.qr();

        log.info(
                "Demo seed ready: area={}, table={}, category={}, menuItem={}, qrLandingUrl={}",
                snapshot.area().getCode(),
                snapshot.table().getCode(),
                snapshot.category().getCode(),
                snapshot.menuItem().getCode(),
                qr.landingUrl()
        );
    }
}
