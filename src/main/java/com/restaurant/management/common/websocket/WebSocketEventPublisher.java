package com.restaurant.management.common.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishOrderEvent(WebSocketEvent event) {
        log.debug("Publishing order event: type={}, entityId={}", event.type(), event.entityId());
        messagingTemplate.convertAndSend("/topic/orders", event);
    }

    public void publishKitchenEvent(WebSocketEvent event) {
        log.debug("Publishing kitchen event: type={}, entityId={}", event.type(), event.entityId());
        messagingTemplate.convertAndSend("/topic/kitchen", event);
    }

    public void publishTableEvent(WebSocketEvent event) {
        log.debug("Publishing table event: type={}, entityId={}", event.type(), event.entityId());
        messagingTemplate.convertAndSend("/topic/tables", event);
    }

    public void publishReservationEvent(WebSocketEvent event) {
        log.debug("Publishing reservation event: type={}, entityId={}", event.type(), event.entityId());
        messagingTemplate.convertAndSend("/topic/reservations", event);
    }

    public void publishServiceRequestEvent(WebSocketEvent event) {
        log.debug("Publishing service request event: type={}", event.type());
        messagingTemplate.convertAndSend("/topic/service-requests", event);
    }
}
